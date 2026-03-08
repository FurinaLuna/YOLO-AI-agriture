import json
import os
import subprocess
import cv2
import requests
import uuid
from flask import Flask, Response, request, jsonify
from ultralytics import YOLO
from predict import predictImg
from flask_socketio import SocketIO, emit


# Flask 应用设置
class VideoProcessingApp:
    def __init__(self, host='0.0.0.0', port=5000):
        """初始化 Flask 应用并设置路由"""
        self.app = Flask(__name__)
        self.socketio = SocketIO(self.app, cors_allowed_origins="*")  # 初始化 SocketIO
        self.host = host
        self.port = port
        self.setup_routes()
        self.data = {}  # 存储接收参数
        self.paths = {
            'download': './runs/video/download.mp4',
            'output': './runs/video/output.mp4',
            'camera_output': "./runs/video/camera_output.avi",
            'video_output': "./runs/video/camera_output.avi"
        }
        self.recording = False  # 标志位，判断是否正在录制视频

    def setup_routes(self):
        """设置所有路由"""
        self.app.add_url_rule('/file_names', 'file_names', self.file_names, methods=['GET'])
        self.app.add_url_rule('/predictImg', 'predictImg', self.predictImg, methods=['POST'])
        self.app.add_url_rule('/predictVideo', 'predictVideo', self.predictVideo)
        self.app.add_url_rule('/predictCamera', 'predictCamera', self.predictCamera)
        self.app.add_url_rule('/stopCamera', 'stopCamera', self.stopCamera, methods=['GET'])

        # 添加 WebSocket 事件
        @self.socketio.on('connect')
        def handle_connect():
            print("WebSocket connected!")
            emit('message', {'data': 'Connected to WebSocket server!'})

        @self.socketio.on('disconnect')
        def handle_disconnect():
            print("WebSocket disconnected!")

    def run(self):
        """启动 Flask 应用"""
        self.socketio.run(self.app, host=self.host, port=self.port, allow_unsafe_werkzeug=True)

    def file_names(self):
        """模型列表接口"""
        weight_items = [{'value': name, 'label': name} for name in self.get_file_names("./weights")]
        return json.dumps({'weight_items': weight_items})

    def predictImg(self):
        """图片预测接口"""
        data = request.get_json()
        print(f"收到图片预测请求: {data}")
        
        # 使用局部变量存储，避免共享状态冲突
        current_params = {
            "username": data['username'],
            "weight": data['weight'],
            "conf": data['conf'],
            "startTime": data['startTime'],
            "inputImg": data['inputImg'],
            "kind": data['kind']
        }
        
        predict = predictImg.ImagePredictor(
            weights_path=f'./weights/{current_params["weight"]}',
            img_path=current_params["inputImg"],
            save_path='./runs/result.jpg',
            kind=current_params["kind"],
            conf=float(current_params["conf"])
        )
        
        # 执行预测
        results = predict.predict()
        uploadedUrl = self.upload('./runs/result.jpg')
        
        # 构造返回结果
        response_data = current_params.copy()
        
        # 判断识别结果
        is_empty = results['labels'] == '未检测到目标' or (isinstance(results['labels'], list) and len(results['labels']) == 0)
        
        if is_empty:
            response_data.update({
                "code": 1,
                "message": "检测结果置信度低于当前设置的阈值，请调低滑动条后再试。"
            })
        elif results['labels'] != '预测失败':
            response_data.update({
                "code": 0,
                "message": "预测成功",
                "outImg": uploadedUrl,
                "allTime": results['allTime'],
                "confidence": json.dumps(results['confidences']),
                "label": json.dumps(results['labels'])
            })
        else:
            response_data.update({
                "code": 1,
                "message": "识别异常，请更换图片。"
            })
            
        # 清理
        path = current_params["inputImg"].split('/')[-1]
        if os.path.exists('./' + path): os.remove('./' + path)
            
        return jsonify(response_data)

    def predictVideo(self):
        """视频流处理接口"""
        # 生成唯一 ID，防止并发请求的文件冲突
        request_id = str(uuid.uuid4())[:8]
        
        # 局部变量存储路径
        local_paths = {
            'download': f'./runs/video/download_{request_id}.mp4',
            'video_output_avi': f'./runs/video/output_{request_id}.avi',
            'video_output_mp4': f'./runs/video/output_{request_id}.mp4'
        }
        
        params = {
            "username": request.args.get('username'),
            "weight": request.args.get('weight'),
            "conf": request.args.get('conf'),
            "startTime": request.args.get('startTime'),
            "inputVideo": request.args.get('inputVideo'),
            "kind": request.args.get('kind')
        }
        
        self.download(params["inputVideo"], local_paths['download'])
        cap = cv2.VideoCapture(local_paths['download'])
        if not cap.isOpened():
            raise ValueError("无法打开视频文件")
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        print(f"[{request_id}] 视频FPS: {fps}")

        # 视频写入器
        video_writer = cv2.VideoWriter(
            local_paths['video_output_avi'],
            cv2.VideoWriter_fourcc(*'XVID'),
            fps,
            (640, 480)
        )
        model = YOLO(f'./weights/{params["weight"]}')

        def generate():
            try:
                current_conf = float(params['conf'])
                while cap.isOpened():
                    ret, frame = cap.read()
                    if not ret:
                        break
                    frame = cv2.resize(frame, (640, 480))
                    # 使用当前请求的置信度
                    results = model.predict(source=frame, conf=current_conf, show=False, agnostic_nms=True)
                    processed_frame = results[0].plot()
                    video_writer.write(processed_frame)
                    _, jpeg = cv2.imencode('.jpg', processed_frame)
                    yield b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n'
            finally:
                self.cleanup_resources(cap, video_writer)
                self.socketio.emit('message', {'data': '处理完成，正在保存！'})
                # 转换并上传
                for progress in self.convert_avi_to_mp4(local_paths['video_output_avi'], local_paths['video_output_mp4']):
                    self.socketio.emit('progress', {'data': progress})
                uploadedUrl = self.upload(local_paths['video_output_mp4'])
                
                record_data = params.copy()
                record_data["outVideo"] = uploadedUrl
                self.save_data(json.dumps(record_data), 'http://localhost:9999/videoRecords')
                self.socketio.emit('video_result', {'url': uploadedUrl})
                self.cleanup_files([local_paths['download'], local_paths['video_output_avi'], local_paths['video_output_mp4']])

        return Response(generate(), mimetype='multipart/x-mixed-replace; boundary=frame')

    def predictCamera(self):
        """摄像头视频流处理接口"""
        request_id = str(uuid.uuid4())[:8]
        local_paths = {
            'camera_output_avi': f'./runs/video/camera_output_{request_id}.avi',
            'camera_output_mp4': f'./runs/video/camera_output_{request_id}.mp4'
        }
        
        params = {
            "username": request.args.get('username'),
            "weight": request.args.get('weight'),
            "kind": request.args.get('kind'),
            "conf": request.args.get('conf'),
            "startTime": request.args.get('startTime')
        }
        
        self.socketio.emit('message', {'data': '正在加载，请稍等！'})
        model = YOLO(f'./weights/{params["weight"]}')
        cap = cv2.VideoCapture(0)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        video_writer = cv2.VideoWriter(local_paths['camera_output_avi'], cv2.VideoWriter_fourcc(*'XVID'), 20, (640, 480))
        self.recording = True

        def generate():
            try:
                current_conf = float(params['conf'])
                while self.recording:
                    ret, frame = cap.read()
                    if not ret:
                        break
                    results = model.predict(source=frame, imgsz=640, conf=current_conf, show=False, agnostic_nms=True)
                    processed_frame = results[0].plot()
                    if self.recording and video_writer:
                        video_writer.write(processed_frame)
                    _, jpeg = cv2.imencode('.jpg', processed_frame)
                    yield b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n'
            finally:
                self.cleanup_resources(cap, video_writer)
                self.socketio.emit('message', {'data': '处理完成，正在保存！'})
                for progress in self.convert_avi_to_mp4(local_paths['camera_output_avi'], local_paths['camera_output_mp4']):
                    self.socketio.emit('progress', {'data': progress})
                uploadedUrl = self.upload(local_paths['camera_output_mp4'])
                
                record_data = params.copy()
                record_data["outVideo"] = uploadedUrl
                self.save_data(json.dumps(record_data), 'http://localhost:9999/cameraRecords')
                self.socketio.emit('video_result', {'url': uploadedUrl})
                self.cleanup_files([local_paths['camera_output_avi'], local_paths['camera_output_mp4']])

        return Response(generate(), mimetype='multipart/x-mixed-replace; boundary=frame')

    def stopCamera(self):
        """停止摄像头预测"""
        self.recording = False
        return json.dumps({"status": 200, "message": "预测成功", "code": 0})

    def save_data(self, data, path):
        """将结果数据上传到服务器"""
        headers = {'Content-Type': 'application/json'}
        try:
            response = requests.post(path, data=data, headers=headers)
            print("记录上传成功！" if response.status_code == 200 else f"记录上传失败，状态码: {response.status_code}")
        except requests.RequestException as e:
            print(f"上传记录时发生错误: {str(e)}")

    def convert_avi_to_mp4(self, temp_output, final_output):
        """使用 FFmpeg 将 AVI 格式转换为 MP4 格式，并显示转换进度。"""
        ffmpeg_command = f"ffmpeg -i {temp_output} -vcodec libx264 {final_output} -y"
        process = subprocess.Popen(ffmpeg_command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                   text=True)
        total_duration = self.get_video_duration(temp_output)

        for line in process.stderr:
            if "time=" in line:
                try:
                    time_str = line.split("time=")[1].split(" ")[0]
                    if "N/A" in time_str:
                        continue
                    h, m, s = map(float, time_str.split(":"))
                    processed_time = h * 3600 + m * 60 + s
                    if total_duration > 0:
                        progress = (processed_time / total_duration) * 100
                        yield progress
                except Exception as e:
                    print(f"解析进度时发生错误: {e}")

        process.wait()
        yield 100

    def get_video_duration(self, path):
        """获取视频总时长（秒）"""
        try:
            cap = cv2.VideoCapture(path)
            if not cap.isOpened():
                return 0
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = cap.get(cv2.CAP_PROP_FPS)
            cap.release()
            return total_frames / fps if fps > 0 else 0
        except Exception:
            return 0

    def get_file_names(self, directory):
        """获取指定文件夹中的所有文件名"""
        try:
            return [file for file in os.listdir(directory) if os.path.isfile(os.path.join(directory, file))]
        except Exception as e:
            print(f"发生错误: {e}")
            return []

    def upload(self, out_path):
        """上传处理后的图片或视频文件到远程服务器"""
        upload_url = "http://localhost:9999/files/upload"
        try:
            with open(out_path, 'rb') as file:
                files = {'file': (os.path.basename(out_path), file)}
                response = requests.post(upload_url, files=files)
                if response.status_code == 200:
                    print("文件上传成功！")
                    return response.json()['data']
                else:
                    print("文件上传失败！")
        except Exception as e:
            print(f"上传文件时发生错误: {str(e)}")

    def download(self, url, save_path):
        """下载文件并保存到指定路径"""
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        try:
            with requests.get(url, stream=True) as response:
                response.raise_for_status()
                with open(save_path, 'wb') as file:
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk:
                            file.write(chunk)
            print(f"文件已成功下载并保存到 {save_path}")
        except requests.RequestException as e:
            print(f"下载失败: {e}")

    def cleanup_files(self, file_paths):
        """清理文件"""
        for path in file_paths:
            if os.path.exists(path):
                os.remove(path)

    def cleanup_resources(self, cap, video_writer):
        """释放资源"""
        if cap.isOpened():
            cap.release()
        if video_writer is not None:
            video_writer.release()
        cv2.destroyAllWindows()


# 启动应用
if __name__ == '__main__':
    video_app = VideoProcessingApp()
    video_app.run()
