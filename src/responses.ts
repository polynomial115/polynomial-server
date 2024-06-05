export const unauthorized = () => Response.json({ error: 'Unauthorized' }, { status: 401 })

export const forbidden = () => Response.json({ error: 'Forbidden' }, { status: 403 })

export const error = (error: string, status = 400) => Response.json({ error }, { status })
