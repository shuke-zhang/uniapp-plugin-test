/**
 * @description 基础数据类型
 */
declare type ResponseResult<T extends object = object> = { code: number, msg: string } & T
/**
 * @description 分页列表数据  返回的是 rows 和 total 如果是其他格式请自定义
 *              注意！ rows 已经 是个 T[] 类型！
 */
declare interface ResponseList<T> {
  total: number
  rows: T[]
}

/**
 * @description 列表数据 多列表，data里面含有多个列表
 */
declare interface ResponseDoubleList<T> {
  total: number
  data: T[]
}

/**
 * @description 数据类型 包含在 data 里面
 */
declare interface ResponseData<T> {
  data: T
}

/**
 * @description 分页列表数据类型 包含在 ResponseRecords 里面
 */
declare interface ResponseRecords<T> {
  records: T[]
  /** 当前页码 */
  current: number
  /** 当前页条数 */
  size: number
  /** 当前总数 */
  total: number
}

/**
 * @description 基础分页参数 current size
 */
declare interface ListParamsBase {
  current: number
  size: number
  orderByColumn?: string
  isAsc?: string
}

/**
 * @description 基础分页参数查询
 */
declare type ListParamsWrapper<T extends object = object> = Partial<ListParamsBase & T>

declare type listGen<T extends object = object> = ListParamsWrapper<T>

declare type listParams<T extends object = object> = ListParamsWrapper<T>

declare type ListAllParams<T extends object = object> = Omit<
  ListParamsWrapper<T>,
  'current' | 'size'
>
