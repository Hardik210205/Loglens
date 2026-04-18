import { HubConnectionBuilder, HubConnection } from '@microsoft/signalr';

let connection: HubConnection | null = null;

export const createLogHubConnection = (): HubConnection => {
  if (!connection) {
    connection = new HubConnectionBuilder()
      .withUrl('/loghub')
      .withAutomaticReconnect()
      .build();
  }
  return connection;
};
