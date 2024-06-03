// based on https://github.com/finsweet/fireworkers/blob/master/src/types.ts

export interface Document {
	name?: string
	fields?: ApiClientObjectMap<Value | undefined>
	createTime?: Timestamp
	updateTime?: Timestamp
}

export interface Value {
	nullValue?: ValueNullValue
	booleanValue?: boolean
	integerValue?: string | number
	doubleValue?: string | number
	timestampValue?: Timestamp
	stringValue?: string
	bytesValue?: string | Uint8Array
	referenceValue?: string
	geoPointValue?: LatLng
	arrayValue?: ArrayValue
	mapValue?: MapValue
}

export type ValueNullValue = 'NULL_VALUE'

export type Timestamp = string | { seconds?: string | number; nanos?: number }

export interface LatLng {
	latitude?: number
	longitude?: number
}

export interface ArrayValue {
	values?: Value[]
}

export interface MapValue {
	fields?: ApiClientObjectMap<Value>
}

export type ApiClientObjectMap<T> = Record<string, T>
