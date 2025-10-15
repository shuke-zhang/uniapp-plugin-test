package com.example.shuke_recorder;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.content.pm.PackageManager;
import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.util.Log;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import java.util.ArrayList;
import java.util.List;

/**
 * 🎧 录音管理器（返回音量数值 0~100）
 */
public class RecorderManager {
    private static final String TAG = "RecorderManager";

    private final Context context;
    private AudioRecord recorder;
    private boolean isRecording = false;
    private Thread recordThread;
    private Listener listener;

    public interface Listener {
        void onStart();
        void onProcess(List<int[]> buffers, int volume, long durationMs, int sampleRate);
        void onStop();
        void onError(String message);
    }

    public RecorderManager(Context context) {
        this.context = context;
    }

    public void setListener(Listener listener) {
        this.listener = listener;
    }

    /** 检查录音权限 */
    public boolean hasPermission() {
        return ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO)
                == PackageManager.PERMISSION_GRANTED;
    }

    /** 请求录音权限 */
    public void requestPermission(Activity activity) {
        ActivityCompat.requestPermissions(activity, new String[]{Manifest.permission.RECORD_AUDIO}, 2001);
    }

    /** 启动录音 */
    @SuppressLint("MissingPermission")
    public void start(String type, int sampleRate) {
        if (!hasPermission()) {
            if (listener != null) listener.onError("未获得录音权限");
            return;
        }

        stop();

        int bufferSize = AudioRecord.getMinBufferSize(
                sampleRate,
                AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT
        );
        if (bufferSize <= 0) {
            if (listener != null) listener.onError("无效的 bufferSize");
            return;
        }

        try {
            recorder = new AudioRecord(
                    MediaRecorder.AudioSource.MIC,
                    sampleRate,
                    AudioFormat.CHANNEL_IN_MONO,
                    AudioFormat.ENCODING_PCM_16BIT,
                    bufferSize
            );
        } catch (Exception e) {
            if (listener != null) listener.onError("初始化录音失败: " + e.getMessage());
            return;
        }

        if (recorder.getState() != AudioRecord.STATE_INITIALIZED) {
            if (listener != null) listener.onError("AudioRecord 初始化失败");
            return;
        }

        recorder.startRecording();
        isRecording = true;
        if (listener != null) listener.onStart();

        recordThread = new Thread(() -> {
            long startTime = SystemClock.elapsedRealtime();
            short[] buffer = new short[bufferSize];
            List<int[]> out = new ArrayList<>();
            Handler main = new Handler(Looper.getMainLooper());

            try {
                double noiseBase = -50; // 初始背景噪声
                while (isRecording && recorder.getRecordingState() == AudioRecord.RECORDSTATE_RECORDING) {
                    int read = recorder.read(buffer, 0, buffer.length);
                    if (read > 0 && listener != null) {
                        int[] frame = new int[read];
                        double sum = 0;
                        for (int i = 0; i < read; i++) {
                            frame[i] = buffer[i];
                            sum += buffer[i] * buffer[i];
                        }
                        out.clear();
                        out.add(frame);

                        // ✅ 改为 0 ~ 100 的整数音量
                        // 计算当前音量 dB
                        double rms = Math.sqrt(sum / read);
                        double db = 20 * Math.log10(rms / 32768.0 + 1e-6);

                    // ✅ 平滑更新噪声基线（取过去几秒的平均噪声）
                        noiseBase = 0.95 * noiseBase + 0.05 * db; // 慢速跟随环境变化

                    // ✅ 根据噪声基线动态调整映射区间
                        double rangeTop = noiseBase + 40; // 从噪声基线往上 40dB
                        double mapped = (db - noiseBase) * (100.0 / 40);

                        int volume = (int) mapped;
                        if (volume < 0) volume = 0;
                        if (volume > 100) volume = 100;

                        long duration = SystemClock.elapsedRealtime() - startTime;
                        List<int[]> send = new ArrayList<>(out);

                        int finalVolume = volume;
                        main.post(() -> listener.onProcess(send, finalVolume, duration, sampleRate));
                    }
                }
            } catch (Exception e) {
                Log.e(TAG, "录音线程异常: " + e.getMessage());
                if (listener != null) {
                    new Handler(Looper.getMainLooper()).post(() -> listener.onError(e.getMessage()));
                }
            }

            stopInternal();
        }, "AudioRecordThread");

        recordThread.start();
    }

    /** 停止录音 */
    public void stop() {
        isRecording = false;
    }

    private void stopInternal() {
        try {
            if (recorder != null) {
                recorder.stop();
                recorder.release();
            }
        } catch (Throwable ignored) {}
        recorder = null;

        if (listener != null) {
            new Handler(Looper.getMainLooper()).post(listener::onStop);
        }
    }
}
