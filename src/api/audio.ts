import type { AudioResponseModel, DoubaoAudioFormatModel, DoubaoAudioModel } from '@/model/audio'
import { request } from '@/utils/request'

export function doubaoSpeechSynthesis(params: { text: string, id: number }) {
  return request.get<{ msg: string, code: number }>({
    url: `/audio/synthesis/v1`,
    withToken: false,
    params,
  })
}

export async function doubaoSpeechSynthesisFormat(params: { text: string, id: number }, cancelPrevious = false): Promise<DoubaoAudioFormatModel> {
  try {
    // 发起请求
    const res = await request.get<{ msg: string, code: number }>({
      url: `/audio/synthesis/v1`,
      withToken: false,
      params,
      showErrorMsg: false,
      cancelPrevious,
    })
    // 解析最外层msg为对象
    const msg = typeof res.msg === 'string' ? JSON.parse(res.msg) as DoubaoAudioModel : res.msg as DoubaoAudioModel

    // 解析audio字段
    const audioData = typeof msg.audio === 'string' ? JSON.parse(msg.audio) as AudioResponseModel : msg.audio as AudioResponseModel

    // 整合成最终格式
    const audioRes: DoubaoAudioFormatModel = {
      id: msg.id,
      text: msg.text,
      audio_base64: audioData.data,
      reqid: audioData.reqid,
      code: audioData.code,
      operation: audioData.operation,
      message: audioData.message,
      sequence: audioData.sequence,
    }

    if (audioRes.code !== 3000) {
      throw new Error(audioRes.message || '语音合成失败')
    }

    return audioRes
  }
  catch (err: any) {
    // 捕获网络异常或JSON解析异常
    throw (err?.message || err)
  }
}
