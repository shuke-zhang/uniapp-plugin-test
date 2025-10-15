package com.example.shuke_recorder;

import android.app.Activity;
import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;

import java.util.List;

import io.dcloud.feature.uniapp.annotation.UniJSMethod;
import io.dcloud.feature.uniapp.bridge.UniJSCallback;
import io.dcloud.feature.uniapp.common.UniModule;

/**
 * 🎙️ Shuke Recorder 插件入口
 * - 分离权限申请
 * - 实时录音数据回调
 * - 音量 0~100 数字版
 */
public class RecorderModule extends UniModule {
    private static final String TAG = "ShukeRecorderModule";
    private RecorderManager recorderManager;
    private UniJSCallback eventCallback;

    /** =============== 请求录音权限 =============== */
    @UniJSMethod(uiThread = true)
    public void requestPermission(UniJSCallback callback) {
        Context ctx = mUniSDKInstance.getContext();
        Activity act = (Activity) ctx;
        if (recorderManager == null) recorderManager = new RecorderManager(ctx);

        // 已有权限
        if (recorderManager.hasPermission()) {
            JSONObject ok = new JSONObject();
            ok.put("granted", true);
            ok.put("message", "录音权限已授予");
            callback.invoke(ok);
            return;
        }

        // 申请权限
        recorderManager.requestPermission(act);

        // 延迟检查
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            JSONObject res = new JSONObject();
            if (recorderManager.hasPermission()) {
                res.put("granted", true);
                res.put("message", "录音权限授权成功");
            } else {
                res.put("granted", false);
                res.put("message", "用户拒绝录音权限");
            }
            callback.invoke(res);
        }, 1000);
    }

    /** =============== 开始录音 =============== */
    @UniJSMethod(uiThread = true)
    public void startRecord(JSONObject params, UniJSCallback callback) {
        Context ctx = mUniSDKInstance.getContext();
        if (recorderManager == null) recorderManager = new RecorderManager(ctx);
        this.eventCallback = callback;

        if (!recorderManager.hasPermission()) {
            sendError("请先调用 requestPermission() 获取录音权限");
            return;
        }

        String type = params.getString("type");
        int sampleRate = params.getIntValue("sampleRate");
        if (sampleRate <= 0) sampleRate = 16000;

        recorderManager.setListener(new RecorderManager.Listener() {
            @Override
            public void onStart() {
                sendStatus("start", "录音开始");
            }

            @Override
            public void onProcess(List<int[]> buffers, int volume, long durationMs, int sampleRate) {
                if (eventCallback == null) return;

                JSONObject payload = new JSONObject();
                JSONArray bufArr = new JSONArray();
                for (int[] arr : buffers) {
                    JSONObject obj = new JSONObject();
                    for (int i = 0; i < arr.length; i++) obj.put(String.valueOf(i), arr[i]);
                    bufArr.add(obj);
                }

                payload.put("buffers", bufArr);
                payload.put("volume", volume);
                payload.put("duration", durationMs);
                payload.put("sampleRate", sampleRate);
                payload.put("type", type);

                eventCallback.invokeAndKeepAlive(payload);
            }

            @Override
            public void onStop() {
                sendStatus("stop", "录音停止");
            }

            @Override
            public void onError(String message) {
                sendError(message);
            }
        });

        recorderManager.start(type, sampleRate);
    }

    /** =============== 停止录音 =============== */
    @UniJSMethod(uiThread = true)
    public void stopRecord(UniJSCallback callback) {
        if (recorderManager != null) {
            recorderManager.stop();
            sendStatus("stop", "录音结束");

            if (callback != null) {
                JSONObject res = new JSONObject();
                res.put("message", "录音已停止");
                callback.invoke(res);
            }
        }
    }

    /** =============== 工具方法 =============== */
    private void sendStatus(String event, String msg) {
        if (eventCallback == null) return;
        JSONObject obj = new JSONObject();
        obj.put("event", event);
        obj.put("message", msg);
        eventCallback.invokeAndKeepAlive(obj);
    }

    private void sendError(String msg) {
        if (eventCallback == null) return;
        JSONObject err = new JSONObject();
        err.put("event", "error");
        err.put("message", msg);
        eventCallback.invokeAndKeepAlive(err);
    }
}
