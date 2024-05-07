// this code is shared with the client
// any updates must be made in both client and server

export enum PayloadType {
	PageUpdate,
	GetPage
}

export interface PayloadData {
	[PayloadType.PageUpdate]: {
		project: string
	}
	[PayloadType.GetPage]: undefined
}

export interface Payload<T extends PayloadType = PayloadType> {
	type: T
	data: PayloadData[T]
}

export function payloadIsType<T extends PayloadType>(payload: Payload, type: T): payload is Payload<T> {
	return payload.type === type
}
