import React, { useState, useCallback, useEffect } from 'react';
import { generateLogo, animateLogo } from './services/geminiService';
import { fileToBase64 } from './utils';
import { AspectRatio, ImageData } from './types';
import { ImageIcon, LoaderIcon, MovieIcon } from './components/icons';

// FIX: Removed duplicate global declaration for `window.aistudio` to resolve type conflicts.
const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('A stylized phoenix rising from ashes, for a tech startup.');
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeySelected, setApiKeySelected] = useState<boolean>(false);
  const [videoLoadingMessage, setVideoLoadingMessage] = useState<string>('');

  const checkApiKey = useCallback(async () => {
    if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setApiKeySelected(hasKey);
    }
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  const handleSelectApiKey = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      // Assume success to avoid race condition and allow immediate use.
      setApiKeySelected(true);
    }
  };

  const handleGenerateLogo = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description for your logo.');
      return;
    }
    setError(null);
    setIsGeneratingImage(true);
    setVideoUrl(null);
    setImageData(null);

    try {
      const base64Image = await generateLogo(prompt);
      setImageData({ base64: base64Image, mimeType: 'image/png' });
    } catch (e: any) {
      setError(`Image generation failed: ${e.message}`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleAnimateLogo = async () => {
    if (!imageData) {
      setError('Please generate or upload a logo first.');
      return;
    }

    // Veo requires API key selection
    await checkApiKey();
    if (!apiKeySelected) {
      await handleSelectApiKey();
    }

    setError(null);
    setIsGeneratingVideo(true);
    setVideoUrl(null);
    
    const messages = [
      "Warming up the animation engine...",
      "Choreographing pixel movements...",
      "Rendering cinematic magic...",
      "This can take a few minutes, please wait...",
      "Almost there, adding the final touches..."
    ];
    let messageIndex = 0;
    setVideoLoadingMessage(messages[messageIndex]);
    const intervalId = setInterval(() => {
        messageIndex = (messageIndex + 1) % messages.length;
        setVideoLoadingMessage(messages[messageIndex]);
    }, 4000);


    try {
      const url = await animateLogo(imageData.base64, imageData.mimeType, aspectRatio);
      setVideoUrl(url);
    } catch (e: any) {
      if (e.message?.includes("Requested entity was not found")) {
          setError("API Key error. Please re-select your API Key and try again.");
          setApiKeySelected(false);
      } else {
          setError(`Video animation failed: ${e.message}`);
      }
    } finally {
      clearInterval(intervalId);
      setIsGeneratingVideo(false);
      setVideoLoadingMessage('');
    }
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file.');
        return;
      }
      try {
        setError(null);
        setVideoUrl(null);
        const base64 = await fileToBase64(file);
        setImageData({ base64, mimeType: file.type });
      } catch (e: any) {
        setError(`Failed to read file: ${e.message}`);
        setImageData(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            AI Logo Animator
          </h1>
          <p className="mt-2 text-lg text-gray-400">Design a logo, then bring it to life.</p>
        </header>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative mb-6" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Controls Column */}
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 shadow-lg flex flex-col space-y-8">
            {/* Step 1: Generate Logo */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-500/20 text-purple-400 rounded-full h-8 w-8 flex items-center justify-center font-bold">1</div>
                <h2 className="text-2xl font-bold">Describe Your Logo</h2>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A minimalist owl icon for an education app"
                className="w-full h-24 p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow"
                disabled={isGeneratingImage || isGeneratingVideo}
              />
              <button
                onClick={handleGenerateLogo}
                disabled={isGeneratingImage || isGeneratingVideo}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900/50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105"
              >
                {isGeneratingImage ? <><LoaderIcon /> Generating...</> : <><ImageIcon /> Generate Logo</>}
              </button>
            </div>
            
            <div className="text-center text-gray-500 font-semibold">OR</div>

            {/* Step 2: Animate Logo */}
            <div className="space-y-4">
               <div className="flex items-center space-x-3">
                <div className="bg-pink-500/20 text-pink-400 rounded-full h-8 w-8 flex items-center justify-center font-bold">2</div>
                <h2 className="text-2xl font-bold">Animate Your Logo</h2>
              </div>
              <div>
                <label htmlFor="logo-upload" className="block text-sm font-medium text-gray-400 mb-2">Upload an existing logo:</label>
                <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-600/20 file:text-pink-300 hover:file:bg-pink-600/30"
                    disabled={isGeneratingImage || isGeneratingVideo}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Aspect Ratio:</label>
                <div className="flex gap-4">
                  {(['16:9', '9:16'] as AspectRatio[]).map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      disabled={isGeneratingImage || isGeneratingVideo}
                      className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${aspectRatio === ratio ? 'bg-pink-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                    >
                      {ratio} {ratio === '16:9' ? '(Landscape)' : '(Portrait)'}
                    </button>
                  ))}
                </div>
              </div>
              
              {!apiKeySelected && (
                 <div className="p-4 bg-blue-900/50 border border-blue-700 rounded-lg text-center">
                    <p className="mb-3 text-blue-300">Video generation requires an API key and may incur costs. Please review the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-blue-200">billing documentation</a>.</p>
                    <button onClick={handleSelectApiKey} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                        Select API Key
                    </button>
                 </div>
              )}

              <button
                onClick={handleAnimateLogo}
                disabled={!imageData || isGeneratingImage || isGeneratingVideo}
                className="w-full flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 disabled:bg-pink-900/50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105"
              >
                {isGeneratingVideo ? <><LoaderIcon /> Animating...</> : <><MovieIcon /> Animate Logo</>}
              </button>
            </div>
          </div>

          {/* Display Column */}
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 shadow-lg flex items-center justify-center aspect-w-16 aspect-h-9 min-h-[300px] lg:min-h-0">
             <div className="w-full h-full flex flex-col items-center justify-center">
              {isGeneratingVideo ? (
                  <div className="text-center">
                      <LoaderIcon />
                      <p className="mt-4 text-lg font-semibold text-gray-300">{videoLoadingMessage}</p>
                  </div>
              ) : videoUrl ? (
                <video src={videoUrl} controls autoPlay loop className="max-w-full max-h-full rounded-lg" />
              ) : imageData ? (
                <img src={`data:${imageData.mimeType};base64,${imageData.base64}`} alt="Generated Logo" className="max-w-full max-h-full object-contain rounded-lg" />
              ) : isGeneratingImage ? (
                  <div className="text-center">
                      <LoaderIcon />
                      <p className="mt-4 text-lg font-semibold text-gray-300">Generating your logo...</p>
                  </div>
              ) : (
                <div className="text-center text-gray-500">
                  <ImageIcon className="mx-auto h-12 w-12" />
                  <p className="mt-4 text-lg">Your generated content will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;