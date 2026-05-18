"""
CINÉMA ShotGrid (Autodesk Flow Production Tracking) Microservice — port 7434
Bridges CINÉMA Film Mode with ShotGrid production management.
Run: python src/services/shotgrid_service.py
"""
import json
from flask import Flask, request, jsonify

app = Flask(__name__)


def get_sg(config: dict):
    """Connect to ShotGrid using the provided config."""
    import shotgun_api3
    return shotgun_api3.Shotgun(
        config['serverUrl'],
        script_name=config['scriptName'],
        api_key=config['apiKey'],
    )


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'shotgrid'})


@app.route('/test', methods=['POST'])
def test_connection():
    config = request.json
    if not config:
        return jsonify({'error': 'Missing config'}), 400
    try:
        sg = get_sg(config)
        # Minimal API call to verify credentials
        sg.find_one('Project', [['id', 'is', config.get('projectId', 0)]])
        return jsonify({'connected': True})
    except Exception as e:
        return jsonify({'connected': False, 'error': str(e)}), 400


@app.route('/projects', methods=['POST'])
def list_projects():
    data = request.json or {}
    config = data.get('config', {})
    try:
        sg = get_sg(config)
        projects = sg.find('Project', [], ['id', 'name', 'sg_status', 'start_date', 'end_date'])
        return jsonify({'projects': projects})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/sync_shots', methods=['POST'])
def sync_shots():
    data = request.json or {}
    config = data.get('config', {})
    sg_project_id = data.get('projectId')
    shots = data.get('shots', [])

    try:
        sg = get_sg(config)
        synced_ids = {}

        for shot in shots:
            shot_data = {
                'project': {'type': 'Project', 'id': sg_project_id},
                'code': shot.get('shotCode', shot.get('id', '')[:20]),
                'description': shot.get('description', shot.get('prompt', '')[:255]),
                'sg_status_list': 'wtg',
                'sg_cut_in': int(shot.get('startTime', 0) * 24),
                'sg_cut_out': int(shot.get('endTime', 0) * 24),
            }
            existing = sg.find_one(
                'Shot',
                [
                    ['project', 'is', {'type': 'Project', 'id': sg_project_id}],
                    ['code', 'is', shot_data['code']],
                ],
            )
            if existing:
                sg.update('Shot', existing['id'], shot_data)
                synced_ids[shot['id']] = existing['id']
            else:
                result = sg.create('Shot', shot_data)
                synced_ids[shot['id']] = result['id']

        return jsonify({'syncedCount': len(synced_ids), 'shotGridIds': synced_ids})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/update_status', methods=['POST'])
def update_status():
    data = request.json or {}
    config = data.get('config', {})
    shot_grid_id = data.get('shotGridId')
    status = data.get('status', 'wtg')
    output_url = data.get('outputVideoUrl')
    version_note = data.get('versionNote', '')

    try:
        sg = get_sg(config)
        sg.update('Shot', shot_grid_id, {'sg_status_list': status})

        if output_url:
            sg_project = sg.find_one('Shot', [['id', 'is', shot_grid_id]], ['project'])
            version = sg.create('Version', {
                'project': sg_project['project'],
                'code': f'v{int(__import__("time").time())}',
                'entity': {'type': 'Shot', 'id': shot_grid_id},
                'sg_path_to_movie': output_url,
                'description': version_note,
                'sg_status_list': 'rev',
            })
            return jsonify({'updated': True, 'versionId': version['id']})

        return jsonify({'updated': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/create_version', methods=['POST'])
def create_version():
    data = request.json or {}
    config = data.get('config', {})
    sg_shot_id = data.get('shotGridShotId')
    video_url = data.get('videoUrl', '')
    version_name = data.get('versionName', f'v{int(__import__("time").time())}')
    frame_range = data.get('frameRange', '1001-1096')
    task_name = data.get('taskName', 'Animation')
    note = data.get('note', '')

    try:
        sg = get_sg(config)
        shot = sg.find_one('Shot', [['id', 'is', sg_shot_id]], ['project'])

        version = sg.create('Version', {
            'project': shot['project'],
            'code': version_name,
            'entity': {'type': 'Shot', 'id': sg_shot_id},
            'sg_path_to_movie': video_url,
            'frame_range': frame_range,
            'description': note,
            'sg_status_list': 'rev',
        })
        return jsonify({'versionId': version['id']})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/import_shots', methods=['POST'])
def import_shots():
    data = request.json or {}
    config = data.get('config', {})
    sg_project_id = data.get('projectId')

    try:
        sg = get_sg(config)
        shots = sg.find(
            'Shot',
            [['project', 'is', {'type': 'Project', 'id': sg_project_id}]],
            ['id', 'code', 'description', 'sg_status_list', 'sg_cut_in', 'sg_cut_out'],
        )
        fps = 24
        cinema_shots = [
            {
                'id': f'sg_{s["id"]}',
                'shotCode': s.get('code', ''),
                'description': s.get('description', ''),
                'status': s.get('sg_status_list', 'wtg'),
                'startTime': (s.get('sg_cut_in') or 0) / fps,
                'endTime': (s.get('sg_cut_out') or 0) / fps,
                'shotGridId': s['id'],
            }
            for s in shots
        ]
        return jsonify({'shots': cinema_shots})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(port=7434, debug=False, host='0.0.0.0')
