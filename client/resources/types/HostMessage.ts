/*
* @Author: aaronpmishkin
* @Date:   2016-07-31 16:48:20
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-23 14:55:43
*/

export interface HostMessage {
	type: MessageType;
	data: any;
	chartId: string;
}

export const enum MessageType {
	UserAdded,
	UserChanged,
	UserRemoved,
	ChangePermissions,
	ConnectionInit,
	KeepConnection
}