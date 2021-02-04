/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { CpuUsageAlert } from './cpu_usage_alert';
import { ALERT_CPU_USAGE } from '../../common/constants';
import { fetchCpuUsageNodeStats } from '../lib/alerts/fetch_cpu_usage_node_stats';
import { fetchClusters } from '../lib/alerts/fetch_clusters';

const RealDate = Date;

jest.mock('../lib/alerts/fetch_cpu_usage_node_stats', () => ({
  fetchCpuUsageNodeStats: jest.fn(),
}));
jest.mock('../lib/alerts/fetch_clusters', () => ({
  fetchClusters: jest.fn(),
}));

jest.mock('../static_globals', () => ({
  Globals: {
    app: {
      getLogger: () => ({ debug: jest.fn() }),
      config: {
        ui: {
          ccs: { enabled: true },
          metricbeat: { index: 'metricbeat-*' },
          container: { elasticsearch: { enabled: false } },
        },
      },
    },
  },
}));

describe('CpuUsageAlert', () => {
  it('should have defaults', () => {
    const alert = new CpuUsageAlert();
    expect(alert.alertOptions.id).toBe(ALERT_CPU_USAGE);
    expect(alert.alertOptions.name).toBe('CPU Usage');
    expect(alert.alertOptions.throttle).toBe('1d');
    expect(alert.alertOptions.defaultParams).toStrictEqual({ threshold: 85, duration: '5m' });
    expect(alert.alertOptions.actionVariables).toStrictEqual([
      { name: 'nodes', description: 'The list of nodes reporting high cpu usage.' },
      { name: 'count', description: 'The number of nodes reporting high cpu usage.' },
      {
        name: 'internalShortMessage',
        description: 'The short internal message generated by Elastic.',
      },
      {
        name: 'internalFullMessage',
        description: 'The full internal message generated by Elastic.',
      },
      { name: 'state', description: 'The current state of the alert.' },
      { name: 'clusterName', description: 'The cluster to which the nodes belong.' },
      { name: 'action', description: 'The recommended action for this alert.' },
      {
        name: 'actionPlain',
        description: 'The recommended action for this alert, without any markdown.',
      },
    ]);
  });

  describe('execute', () => {
    function FakeDate() {}
    FakeDate.prototype.valueOf = () => 1;

    const clusterUuid = 'abc123';
    const clusterName = 'testCluster';
    const nodeId = 'myNodeId';
    const nodeName = 'myNodeName';
    const cpuUsage = 91;
    const stat = {
      clusterUuid,
      nodeId,
      nodeName,
      cpuUsage,
    };

    const replaceState = jest.fn();
    const scheduleActions = jest.fn();
    const getState = jest.fn();
    const executorOptions = {
      services: {
        callCluster: jest.fn(),
        alertInstanceFactory: jest.fn().mockImplementation(() => {
          return {
            replaceState,
            scheduleActions,
            getState,
          };
        }),
      },
      state: {},
    };

    beforeEach(() => {
      // @ts-ignore
      Date = FakeDate;
      (fetchCpuUsageNodeStats as jest.Mock).mockImplementation(() => {
        return [stat];
      });
      (fetchClusters as jest.Mock).mockImplementation(() => {
        return [{ clusterUuid, clusterName }];
      });
    });

    afterEach(() => {
      Date = RealDate;
      replaceState.mockReset();
      scheduleActions.mockReset();
      getState.mockReset();
    });

    it('should fire actions', async () => {
      const alert = new CpuUsageAlert();
      const type = alert.getAlertType();
      await type.executor({
        ...executorOptions,
        params: alert.alertOptions.defaultParams,
      } as any);
      const count = 1;
      expect(replaceState).toHaveBeenCalledWith({
        alertStates: [
          {
            ccs: undefined,
            cluster: { clusterUuid, clusterName },
            cpuUsage,
            itemLabel: undefined,
            meta: {
              clusterUuid,
              cpuUsage,
              nodeId,
              nodeName,
            },
            nodeId,
            nodeName,
            ui: {
              isFiring: true,
              message: {
                text:
                  'Node #start_linkmyNodeName#end_link is reporting cpu usage of 91% at #absolute',
                nextSteps: [
                  {
                    text: '#start_linkCheck hot threads#end_link',
                    tokens: [
                      {
                        startToken: '#start_link',
                        endToken: '#end_link',
                        type: 'docLink',
                        partialUrl:
                          '{elasticWebsiteUrl}guide/en/elasticsearch/reference/{docLinkVersion}/cluster-nodes-hot-threads.html',
                      },
                    ],
                  },
                  {
                    text: '#start_linkCheck long running tasks#end_link',
                    tokens: [
                      {
                        startToken: '#start_link',
                        endToken: '#end_link',
                        type: 'docLink',
                        partialUrl:
                          '{elasticWebsiteUrl}guide/en/elasticsearch/reference/{docLinkVersion}/tasks.html',
                      },
                    ],
                  },
                ],
                tokens: [
                  {
                    startToken: '#absolute',
                    type: 'time',
                    isAbsolute: true,
                    isRelative: false,
                    timestamp: 1,
                  },
                  {
                    startToken: '#start_link',
                    endToken: '#end_link',
                    type: 'link',
                    url: 'elasticsearch/nodes/myNodeId',
                  },
                ],
              },
              severity: 'danger',
              triggeredMS: 1,
              lastCheckedMS: 0,
            },
          },
        ],
      });
      expect(scheduleActions).toHaveBeenCalledWith('default', {
        internalFullMessage: `CPU usage alert is firing for ${count} node(s) in cluster: ${clusterName}. [View nodes](elasticsearch/nodes)`,
        internalShortMessage: `CPU usage alert is firing for ${count} node(s) in cluster: ${clusterName}. Verify CPU levels across affected nodes.`,
        action: `[View nodes](elasticsearch/nodes)`,
        actionPlain: 'Verify CPU levels across affected nodes.',
        clusterName,
        count,
        nodes: `${nodeName}:${cpuUsage}`,
        state: 'firing',
      });
    });

    it('should not fire actions if under threshold', async () => {
      (fetchCpuUsageNodeStats as jest.Mock).mockImplementation(() => {
        return [
          {
            ...stat,
            cpuUsage: 1,
          },
        ];
      });
      const alert = new CpuUsageAlert();
      const type = alert.getAlertType();
      await type.executor({
        ...executorOptions,
        params: alert.alertOptions.defaultParams,
      } as any);
      expect(replaceState).toHaveBeenCalledWith({
        alertStates: [],
      });
      expect(scheduleActions).not.toHaveBeenCalled();
    });

    it('should handle ccs', async () => {
      const ccs = 'testCluster';
      (fetchCpuUsageNodeStats as jest.Mock).mockImplementation(() => {
        return [
          {
            ...stat,
            ccs,
          },
        ];
      });
      const alert = new CpuUsageAlert();
      const type = alert.getAlertType();
      await type.executor({
        ...executorOptions,
        params: alert.alertOptions.defaultParams,
      } as any);
      const count = 1;
      expect(scheduleActions).toHaveBeenCalledWith('default', {
        internalFullMessage: `CPU usage alert is firing for ${count} node(s) in cluster: ${clusterName}. [View nodes](elasticsearch/nodes)`,
        internalShortMessage: `CPU usage alert is firing for ${count} node(s) in cluster: ${clusterName}. Verify CPU levels across affected nodes.`,
        action: `[View nodes](elasticsearch/nodes)`,
        actionPlain: 'Verify CPU levels across affected nodes.',
        clusterName,
        count,
        nodes: `${nodeName}:${cpuUsage}`,
        state: 'firing',
      });
    });
  });
});
