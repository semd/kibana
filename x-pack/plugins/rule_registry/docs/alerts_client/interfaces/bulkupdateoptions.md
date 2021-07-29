[Alerts as data client API Interface](../alerts_client_api.md) / BulkUpdateOptions

# Interface: BulkUpdateOptions<Params\>

## Type parameters

| Name | Type |
| :------ | :------ |
| `Params` | `Params`: `AlertTypeParams` |

## Table of contents

### Properties

- [ids](bulkupdateoptions.md#ids)
- [index](bulkupdateoptions.md#index)
- [query](bulkupdateoptions.md#query)
- [status](bulkupdateoptions.md#status)

## Properties

### ids

• **ids**: `undefined` \| ``null`` \| `string`[]

#### Defined in

[alerts_client.ts:59](https://github.com/elastic/kibana/blob/8860188e2d5/x-pack/plugins/rule_registry/server/alert_data_client/alerts_client.ts#L59)

___

### index

• **index**: `string`

#### Defined in

[alerts_client.ts:61](https://github.com/elastic/kibana/blob/8860188e2d5/x-pack/plugins/rule_registry/server/alert_data_client/alerts_client.ts#L61)

___

### query

• **query**: `undefined` \| ``null`` \| `string`

#### Defined in

[alerts_client.ts:62](https://github.com/elastic/kibana/blob/8860188e2d5/x-pack/plugins/rule_registry/server/alert_data_client/alerts_client.ts#L62)

___

### status

• **status**: ``"open"`` \| ``"closed"``

#### Defined in

[alerts_client.ts:60](https://github.com/elastic/kibana/blob/8860188e2d5/x-pack/plugins/rule_registry/server/alert_data_client/alerts_client.ts#L60)
