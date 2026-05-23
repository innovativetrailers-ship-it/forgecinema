"""
CINÉMA OpenEXR Service — port 7435
Parses .exr files and returns channel data for deep compositing.
Run: python src/services/exr_service.py
"""
import struct
import tempfile
import os
import json
from flask import Flask, request, jsonify

app = Flask(__name__)


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'exr'})


@app.route('/parse', methods=['POST'])
def parse_exr():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.exr')
    file.save(tmp.name)
    tmp.close()

    try:
        result = parse_exr_file(tmp.name)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        try:
            os.unlink(tmp.name)
        except OSError:
            pass


@app.route('/parse_url', methods=['POST'])
def parse_exr_url():
    data = request.json or {}
    url = data.get('url')
    if not url:
        return jsonify({'error': 'url required'}), 400

    import urllib.request
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.exr')
    tmp.close()
    try:
        urllib.request.urlretrieve(url, tmp.name)
        result = parse_exr_file(tmp.name)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        try:
            os.unlink(tmp.name)
        except OSError:
            pass


def parse_exr_file(path: str) -> dict:
    try:
        import OpenEXR
        import Imath
        import array

        exr = OpenEXR.InputFile(path)
        header = exr.header()

        dw = header['dataWindow']
        width = dw.max.x - dw.min.x + 1
        height = dw.max.y - dw.min.y + 1

        channels = list(header['channels'].keys())
        has_depth = 'Z' in channels
        has_cryptomatte = any(c.startswith('id.') or c.startswith('crypto') for c in channels)

        # Extract RGBA + Z if present
        pt = Imath.PixelType(Imath.PixelType.FLOAT)
        data = {}
        for ch in channels[:8]:  # limit to 8 channels for browser transfer
            raw = exr.channel(ch, pt)
            arr = array.array('f', raw)
            data[ch] = list(arr[:width * height])  # flatten to list for JSON

        exr.close()

        return {
            'width': width,
            'height': height,
            'channels': channels,
            'hasDepth': has_depth,
            'hasCryptomatte': has_cryptomatte,
            'channelData': data,
        }

    except ImportError:
        # OpenEXR not installed — return minimal metadata from magic bytes
        return parse_exr_minimal(path)


def parse_exr_minimal(path: str) -> dict:
    """Parse EXR header without OpenEXR library — returns metadata only."""
    with open(path, 'rb') as f:
        magic = f.read(4)
        if magic != b'\x76\x2f\x31\x01':
            raise ValueError('Not a valid OpenEXR file')

        # Read version (4 bytes)
        f.read(4)

        channels = []
        width, height = 0, 0

        # Read attributes until we find what we need
        for _ in range(200):
            name = b''
            while True:
                c = f.read(1)
                if c == b'\x00':
                    break
                name += c
                if len(name) > 100:
                    break

            name_str = name.decode('utf-8', errors='ignore')
            if not name_str:
                break

            typ = b''
            while True:
                c = f.read(1)
                if c == b'\x00':
                    break
                typ += c
                if len(typ) > 100:
                    break

            size = struct.unpack('<I', f.read(4))[0]

            if name_str == 'dataWindow':
                vals = struct.unpack('<4i', f.read(16))
                width = vals[2] - vals[0] + 1
                height = vals[3] - vals[1] + 1
            elif name_str == 'channels':
                raw = f.read(size)
                # Simple parsing: find null-terminated channel names
                i = 0
                while i < len(raw):
                    end = raw.find(b'\x00', i)
                    if end == i:
                        break
                    channels.append(raw[i:end].decode('utf-8', errors='ignore'))
                    i = end + 1 + 36  # skip channel type info (36 bytes)
            else:
                f.read(size)

    return {
        'width': width,
        'height': height,
        'channels': channels,
        'hasDepth': 'Z' in channels,
        'hasCryptomatte': any(c.startswith('id.') or c.startswith('crypto') for c in channels),
        'channelData': {},
        'metadataOnly': True,
    }


if __name__ == '__main__':
    port = int(os.environ.get('PORT', '7435'))
    app.run(port=port, debug=False, host='0.0.0.0')
