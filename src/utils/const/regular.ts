/**
 * @description 手机号码正则
 */
export const PhoneReg = /^1[3-9]\d{9}$/

/**
 * @description 身份证号码正则
 */
export const idCardReg = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9X]$/i

/**
 * @description 身份证号码正则
 */
export const passwordReg = /^(?=.*[A-Z])(?=.*\d)[A-Z\d]{5,10}$/i
