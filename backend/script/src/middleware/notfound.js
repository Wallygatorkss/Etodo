// fonction middleware pour gerer les routes non trouvees
export default function notFound(req, res, next) {
	return next('NOT_FOUND');
}
