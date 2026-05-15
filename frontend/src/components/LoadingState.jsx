import Spinner from './Spinner';

const LoadingState = ({ message = 'Cargando...', size = 'medium' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <Spinner size={size} />
      <p className="mt-4 text-gray-600 text-center">{message}</p>
    </div>
  );
};

export default LoadingState;
