import { PluginEvent } from 'posthog-plugins'
import { PluginMeta, PluginAttachment } from 'posthog-plugins'

interface SchemaProp {
    type: string
    required?: boolean
}

export interface SchemaEvent {
    acceptOnlySchemaProps?: boolean
    schema: {
        [key: string]: SchemaProp
    }
}

export interface SchemaObject {
    onlyIngestEventsFromFile?: boolean
    eventSchemas: {
        [key: string]: SchemaEvent
    }
}

export interface Meta extends PluginMeta {
    attachments: {
        eventSchemaFile?: PluginAttachment
    }
    global: {
        schemaFile?: SchemaObject
    }
}

const ACCEPTED_TYPES = new Set(['number', 'string', 'boolean'])
const isBool = (valueToCheck) => typeof valueToCheck === 'boolean'

const areValuesValid = (jsonSchema: SchemaObject) => {
    try {
        for (const eventSchema of Object.values(jsonSchema.eventSchemas)) {
            if (eventSchema.acceptOnlySchemaProps && !isBool(eventSchema.acceptOnlySchemaProps)) {
                return false
            }

            for (const prop of Object.values(eventSchema.schema)) {
                if ((prop.required && !isBool(prop.required)) || !ACCEPTED_TYPES.has(prop.type)) {
                    return false
                }
            }
        }

        if (jsonSchema.onlyIngestEventsFromFile) {
            return isBool(jsonSchema.onlyIngestEventsFromFile)
        }

        return true
    } catch {
        return false
    }
}

export const isValidSchemaFile = (jsonSchema: SchemaObject) => {
    const checks = [
        {
            validate: (jsonSchema) => !!jsonSchema['eventSchemas'],
            errorMessage: 'Your file has no specified schemas. Please specify at least one.',
        },
        {
            validate: areValuesValid,
            errorMessage: 'Your file has invalid option values.',
        },
    ]

    for (const check of checks) {
        if (!check.validate(jsonSchema)) {
            throw new Error(check.errorMessage)
        }
    }
}

export function setupPlugin({ attachments, global }: Meta) {
    try {
        global.schemaFile = JSON.parse(attachments.eventSchemaFile.contents.toString())
    } catch {
        throw new Error('Invalid JSON! Make sure your file has valid JSON.')
    }

    isValidSchemaFile(global.schemaFile)
}

export function processEvent(event: PluginEvent, { global }) {
    const schema = global.schemaFile
    const eventSchema: SchemaEvent = schema.eventSchemas[event.event]

    // For events not specified in the schema file
    if (!eventSchema) {
        // Only ingest if schema present
        if (schema.onlyIngestEventsFromFile) {
            return
        }
        return event // Otherwise ingest without checking
    }

    const schemaPropsOnly = eventSchema.acceptOnlySchemaProps

    let validProps = {}

    for (const [propName, propSchema] of Object.entries(eventSchema.schema)) {
        const eventPropertyVal = event.properties[propName]

        if (
            (!eventPropertyVal && propSchema.required) || // Property missing
            (eventPropertyVal !== undefined && typeof eventPropertyVal !== propSchema.type.toLowerCase()) // Wrong type
        ) {
            return
        }

        validProps[propName] = eventPropertyVal
    }

    // Ingest event only with relevant properties
    if (schemaPropsOnly) {
        event.properties = validProps
    }

    return event
}
