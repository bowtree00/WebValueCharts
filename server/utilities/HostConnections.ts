/*
* @Author: aaronpmishkin
* @Date:   2016-08-01 15:27:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-02 10:47:26
*/

export interface HostConnectionStatus {
	chartId: string;
	connectionStatus: string;
	userChangesAccepted: boolean;
}

export var hostConnections: Map<string, HostConnectionStatus> = new Map<string, HostConnectionStatus>();