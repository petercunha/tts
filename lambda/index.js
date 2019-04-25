/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */

exports.tts = (req, res) => {
	// Enable CORS for each of the subdomains
	const allowedOrigins = ['https://textreader.pro']
	const origin = req.headers.origin
	if (allowedOrigins.indexOf(origin) > -1) {
		res.setHeader('Access-Control-Allow-Origin', origin)
	}
	res.set('Access-Control-Allow-Methods', 'GET, POST')
	res.set(
		'Access-Control-Allow-Headers',
		'Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With'
	)

	// Intercept non-POST requests
	if (req.method != 'POST') {
		res.send('ok')
		return
	}

	// Import request module
	const request = require('request')

	// Prepare request params for Streamlabs
	let voice = req.body.voice || 'Brian'
	let text = req.body.text || 'Please select a voice and message.'

	// Send request to Streamlabs' API server
	request.post(
		'https://streamlabs.com/polly/speak',
		{ json: { voice: voice, text: text } },
		function(error, response, body) {
			if (!error && response.statusCode == 200) {
				res.status(200).json(body)
			} else {
				res.status(500).json({
					success: false,
					reason: 'Streamlabs API error.',
					error: error,
					code: response.statusCode
				})
			}
		}
	)

	// Log output to console
	const jsonLog = {
		payload: {
			voice: voice,
			text: text
		},
		requestOrigin: origin,
		requestIP: req.ip
	}
	console.log('Request Log:\n' + JSON.stringify(jsonLog))
}
