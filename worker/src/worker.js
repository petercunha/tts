/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run "npm run dev" in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run "npm run deploy" to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { Router, createCors } from 'itty-router';
import { createClient } from '@supabase/supabase-js';

const { preflight } = createCors();
const router = Router();

const corsHeaders = {
	'Access-Control-Allow-Headers': '*', // What headers are allowed. * is wildcard. Instead of using '*', you can specify a list of specific headers that are allowed, such as: Access-Control-Allow-Headers: X-Requested-With, Content-Type, Accept, Authorization.
	'Access-Control-Allow-Methods': 'GET, POST', // Allowed methods. Others could be GET, PUT, DELETE etc.
	'Access-Control-Allow-Origin': '*', // This is URLs that are allowed to access the server. * is the wildcard character meaning any URL can.
};

router.all('*', preflight);

router.get('/', async (request, env) => {
	const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
	const { data, error } = await supabase.from('requests').select('*').limit(10);
	if (error) throw error;
	return new Response(JSON.stringify(data), {
		headers: {
			'Content-Type': 'application/json',
			...corsHeaders,
		},
	});
});

router.post('/log', async (request, env) => {
	if (request.headers.get('Content-Type') === 'application/json') {
		const json = await request.json();
		if (json.text && json.voice) {
			const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
			const { error } = await supabase.from('requests').insert({
				voice: json.voice,
				text: json.text,
				ip: request.headers.get('CF-Connecting-IP'),
			});
			if (error) throw error;
			return new Response('ok', { headers: { ...corsHeaders } });
		} else {
			return new Response('400 Bad Request', { status: 400, ...corsHeaders });
		}
	} else {
		return new Response('400 Bad Request', { status: 400, ...corsHeaders });
	}
});

router.all('*', () => new Response('404 Not Found', { status: 404, ...corsHeaders }));

export default {
	fetch: router.handle,
};
