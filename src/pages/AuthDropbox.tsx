import { Cloud } from 'lucide-react';

export default function AuthDropbox() {
  const handleDropboxLogin = () => {
    console.log('Login with Dropbox');
  };

  return (
    <div className="min-h-screen p-6 pb-24 md:pl-24 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-8">
          <div className="flex justify-center mb-8">
            <div className="p-4 bg-blue-500/20 rounded-lg">
              <Cloud className="w-12 h-12 text-blue-400" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center mb-2">
            Connect Dropbox
          </h1>
          <p className="text-gray-400 text-center mb-8">
            Sync your data with Dropbox
          </p>

          <button
            onClick={handleDropboxLogin}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <Cloud className="w-5 h-5" />
            Login with Dropbox
          </button>
        </div>
      </div>
    </div>
  );
}
