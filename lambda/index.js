/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */

exports.tts = (req, res) => {
    const request = require('request')

    let voice = req.body.voice || 'Brian'
    let text = req.body.text || 'Please select a voice and message.'

    request.post(
        'https://streamlabs.com/polly/speak',
        { json: { voice: voice, text: text } },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                res.status(200).json(body);
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
}