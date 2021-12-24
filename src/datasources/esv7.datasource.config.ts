import 'dotenv/config';
import datasource from './esv7.datasource.config.json';
'use strict'

export default {
    ...datasource,
    "connector": "esv6",
    "index": "catalog",
    "version": 7,
    "debug": process.env.APP_ENV === 'dev',
    "defaultSize": 50,
    "configuration": {
        "node": process.env.ELASTICSEARCH_HOST,
        "requestTimeout": process.env.ELASTICSEARCH_REQUEST_TIMEOUT,
        "pingTimeout": process.env.ELASTICSEARCH_PING_TIMEOUT
    },
    mappingProperties: {
        docType: {
            type: 'keyword',
        },
        id: {
            type: 'keyword',
        },
        name: {
            type: 'text', //analisado
            fields: {
                keyword: {
                    type: 'keyword',
                    ignore_above: 256,
                },
            },
        },
        description: {
            type: 'text', //analisado
        },
        type: {
            type: 'byte',
        },
        is_active: {
            type: 'boolean',
        },
        created_at: {
            type: 'date',
        },
        updated_at: {
            type: 'date',
        },
        categories: {
            type: 'nested',
            properties: {
                id: {type: 'keyword'},
                name: {
                    type: 'text',
                    fields: {
                        keyword: {
                            type: 'keyword',
                            ignore_above: 256,
                        },
                    },
                },
                is_active: {type: 'boolean'}
            },
        }
    }
}

