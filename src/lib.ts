import { SchemaObject } from './types'

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
