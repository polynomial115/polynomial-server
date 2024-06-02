export const unauthorized = () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

export const forbidden = () => new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })

export const error = (error: string, status = 400) => new Response(JSON.stringify({ error }), { status })
