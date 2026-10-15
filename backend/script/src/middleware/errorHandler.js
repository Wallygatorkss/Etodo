// au lieu de renvoyer des mess d'erreur en dur dans chaque route,
// on les centralise ici et on appelle juste next('TYPE_D_ERREUR');
const ERROR_MAP = {
    NO_TOKEN: { status: 401, body: { msg: 'No token, authorization denied' } },
    INVALID_TOKEN: { status: 401, body: { msg: 'Token is not valid' } },
    NOT_FOUND: { status: 404, body: { msg: 'Not found' } },
    BAD_PARAMETER: { status: 400, body: { msg: 'Bad parameter' } },
};

// pour les cas dune erreur geree
function errorHandler(err, req, res, next) {
    // autorise le passage d'un type de chaine simple (next('NOT_FOUND')) ou d'un objet avec type
    const type = typeof err === 'string' ? err : err?.type;

    if (type && ERROR_MAP[type]) {
        const { status, body } = ERROR_MAP[type];
        return res.status(status).json(body);
    }

    // si une route a deja defini un status, ca le garde mais ca normalise
    // au format demande
    if (res.headersSent) {
        return next(err);
    }

    // dans le cas d'une erreur non geree
    const DEFAULT_ERROR = { status: 500, body: { msg: 'Internal server error' } };
    return res.status(DEFAULT_ERROR.status).json(DEFAULT_ERROR.body);
}

export default errorHandler;