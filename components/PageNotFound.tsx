export default function PageNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-700 mb-2">
        Page Not Found
      </h2>
      <p className="text-gray-500 mb-6 text-center">
        The page you are looking for does not exist or you don't have permission
        to access it.
      </p>
    </div>
  );
}
