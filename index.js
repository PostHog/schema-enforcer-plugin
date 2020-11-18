async function setupPlugin({ attachments, global }) {
    try {
        global.schemaFile = JSON.parse(attachments.eventSchemaFile.contents.toString())
    } catch {
        throw new Error('Invalid JSON! Make sure your file has valid JSON.')
    }

    isValidSchemaFile(global.schemaFile)

}

async function processEvent(event, { global }) {
    const schema = global.schemaFile
    const eventSchema = schema.eventSchemas[event.event]

    // For events not specified in the schema file
    if (!eventSchema) {
        if (schema.onlyIngestEventsFromFile) return // Only ingest if schema present
        
        return event // Otherwise ingest without checking
    }

    const schemaPropsOnly = eventSchema.acceptOnlySchemaProps

    let validProps = {}

    for (const [propName, propSchema] of Object.entries(eventSchema.schema)) {
        const eventPropertyVal = event.properties[propName]
        
        if (
            (!eventPropertyVal && propSchema.required) || // Property missing
            (typeof eventPropertyVal !== propSchema.type.toLowerCase()) // Wrong type
        ) return

        validProps[propName] = eventPropertyVal
    }

    // Ingest event only with relevant properties
    if (schemaPropsOnly) event.properties = validProps

    return event
}
