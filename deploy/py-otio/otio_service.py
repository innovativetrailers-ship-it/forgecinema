"""
CINÉMA OTIO Microservice — port 7432
Converts CINÉMA TimelineRecipe JSON ↔ EDL / FCPXML / AAF / OTIOZ via OpenTimelineIO.
Run: python src/services/otio_service.py
"""
from flask import Flask, request, jsonify, send_file
import opentimelineio as otio
import json
import os
import tempfile

app = Flask(__name__)


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'otio'})


@app.route('/convert', methods=['POST'])
def convert():
    data = request.json
    if not data or 'timeline' not in data or 'format' not in data:
        return jsonify({'error': 'Missing timeline or format'}), 400

    timeline_json = data['timeline']
    output_format = data['format']  # 'edl' | 'fcpxml' | 'aaf' | 'resolve_xml' | 'otioz'

    try:
        timeline = build_otio_from_cinema(timeline_json)
        ext = get_extension(output_format)
        tmp = tempfile.NamedTemporaryFile(suffix=f'.{ext}', delete=False)
        tmp.close()

        # Map CINÉMA format names to OTIO adapter names
        adapter_map = {
            'edl':         'cmx_3600',
            'fcpxml':      'fcp_xml',
            'aaf':         'advanced_authoring_format',
            'resolve_xml': 'fcp_xml',
            'otioz':       'otioz',
        }
        adapter = adapter_map.get(output_format, output_format)
        otio.adapters.write_to_file(timeline, tmp.name, adapter_name=adapter)

        return send_file(
            tmp.name,
            as_attachment=True,
            download_name=f'export.{ext}',
            mimetype='application/octet-stream',
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/import', methods=['POST'])
def import_timeline():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    ext = os.path.splitext(file.filename)[1].lower() if file.filename else '.xml'
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
    file.save(tmp.name)
    tmp.close()

    try:
        timeline = otio.adapters.read_from_file(tmp.name)
        return jsonify(otio_to_cinema(timeline))
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        try:
            os.unlink(tmp.name)
        except OSError:
            pass


def build_otio_from_cinema(recipe: dict) -> otio.schema.Timeline:
    fps = recipe.get('fps', 24)
    timeline = otio.schema.Timeline(name=recipe.get('projectId', 'CINÉMA Export'))
    timeline.global_start_time = otio.opentime.RationalTime(0, fps)

    for track in recipe.get('tracks', []):
        track_kind = (
            otio.schema.TrackKind.Video
            if track.get('type') == 'video'
            else otio.schema.TrackKind.Audio
        )
        otio_track = otio.schema.Track(
            name=track.get('label', 'Track'),
            kind=track_kind,
        )

        sorted_clips = sorted(track.get('clips', []), key=lambda c: c.get('startTime', 0))

        for clip in sorted_clips:
            start_sec = clip.get('startTime', 0)
            end_sec = clip.get('endTime', start_sec)
            dur_sec = max(0, end_sec - start_sec)

            start_rt = otio.opentime.RationalTime(start_sec * fps, fps)
            dur_rt = otio.opentime.RationalTime(dur_sec * fps, fps)

            media_ref = otio.schema.ExternalReference(
                target_url=clip.get('sourceUrl', ''),
                available_range=otio.opentime.TimeRange(
                    otio.opentime.RationalTime(0, fps),
                    dur_rt,
                ),
            )
            otio_clip = otio.schema.Clip(
                name=(clip.get('prompt') or clip.get('id') or 'clip')[:60],
                media_reference=media_ref,
                source_range=otio.opentime.TimeRange(
                    otio.opentime.RationalTime(0, fps),
                    dur_rt,
                ),
            )
            otio_clip.metadata['cinema'] = {
                'id': clip.get('id', ''),
                'modelUsed': clip.get('modelUsed', ''),
                'prompt': clip.get('prompt', ''),
            }

            # Insert gap if there's a hole before this clip
            if otio_track.children:
                last_end = otio_track.children[-1].trimmed_range().end_time_exclusive()
                if start_rt > last_end:
                    gap_dur = start_rt - last_end
                    gap = otio.schema.Gap(
                        source_range=otio.opentime.TimeRange(
                            otio.opentime.RationalTime(0, fps),
                            gap_dur,
                        )
                    )
                    otio_track.append(gap)

            otio_track.append(otio_clip)

        timeline.tracks.append(otio_track)

    return timeline


def otio_to_cinema(otio_timeline: otio.schema.Timeline) -> dict:
    fps = 24
    if otio_timeline.global_start_time:
        fps = otio_timeline.global_start_time.rate or 24

    tracks = []
    for i, track in enumerate(otio_timeline.tracks):
        track_type = 'video' if track.kind == otio.schema.TrackKind.Video else 'audio'
        clips = []
        for item in track.children:
            if isinstance(item, otio.schema.Clip):
                r = item.range_in_parent()
                meta = item.metadata.get('cinema', {})
                clips.append({
                    'id': meta.get('id') or f'imported_{i}_{len(clips)}',
                    'trackId': f'track_{i}',
                    'startTime': r.start_time.value / fps,
                    'endTime': r.end_time_exclusive().value / fps,
                    'sourceUrl': (
                        item.media_reference.target_url
                        if hasattr(item.media_reference, 'target_url')
                        else ''
                    ),
                    'prompt': meta.get('prompt') or item.name,
                    'modelUsed': meta.get('modelUsed', ''),
                })
        tracks.append({
            'id': f'track_{i}',
            'type': track_type,
            'label': track.name or f'Track {i + 1}',
            'muted': False,
            'locked': False,
            'solo': False,
            'clips': clips,
        })

    return {
        'fps': int(fps),
        'durationSeconds': sum(
            max(c.get('endTime', 0) for c in t['clips']) if t['clips'] else 0
            for t in tracks
        ),
        'tracks': tracks,
    }


def get_extension(fmt: str) -> str:
    return {
        'edl':         'edl',
        'fcpxml':      'xml',
        'aaf':         'aaf',
        'resolve_xml': 'xml',
        'otioz':       'otioz',
    }.get(fmt, 'xml')


if __name__ == '__main__':
    port = int(os.environ.get('PORT', '7432'))
    app.run(port=port, debug=False, host='0.0.0.0')
