import React, { useState } from "react";
import { FaFile } from "react-icons/fa";
import axios from "axios";

const Home = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [convert, setConvert] = useState(null);
  const [downloadError, setDownloadError] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Add loading state

  const onChangeEvent = (e) => {
    setSelectedFile(e.target.files[0]);
    setConvert(null);
    setDownloadError(null);
  };

  const handlesubmit = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setConvert("Please select a file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    setIsLoading(true); // Set loading state to true

    try {
      const response = await axios.post(
        `http://localhost:3000/convertfile`,
        formData,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${selectedFile.name.replace(/\.[^/.]+$/, "")}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

      setConvert("File converted successfully.");
      setDownloadError(null);
      setSelectedFile(null);
    } catch (error) {
      console.error("Error during file conversion:", error);
      if (error.response && error.response.status === 400) {
        setDownloadError(`Error occurred: ${error.response.data.message}`);
      } else {
        setDownloadError("An unexpected error occurred.");
      }
      setConvert(null);
    } finally {
      setIsLoading(false); // Reset loading state after the request completes
    }
  };

  return (
    <>
      <div className="max-w-screen-2xl mx-auto container px-6 md:px-20 py-10  bg-pink-300">
        <div className="flex flex-col h-screen items-center justify-center space-y-6">
          {/* Content Box */}
          <div className="border-2 border-dashed px-6 py-6 md:px-10 md:py-10 border-indigo-400 rounded-lg shadow-lg bg-white">
            <h1 className="text-3xl font-bold text-center mb-4 text-indigo-700">
              Convert Word to PDF Online
            </h1>
            <p className="text-sm text-center mb-5 text-gray-500">
              Easily convert Word documents to PDF format online, without
              having to install any software.
            </p>
          </div>

          {/* File Upload Section */}
          <div className="flex flex-col items-center  space-y-4">
            {/* File Input */}
            <input
              type="file"
              accept=".doc, .docx"
              className="hidden"
              onChange={onChangeEvent}
              id="FileInput"
            />
            <label
              htmlFor="FileInput"
              className="w-full max-w-sm flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg shadow-md cursor-pointer border border-blue-300 hover:bg-blue-700 hover:text-white transition duration-300"
            >
              <FaFile className="text-3xl mr-3" />
              <span className="text-sm font-medium">
                {selectedFile ? selectedFile.name : "Choose File"}
              </span>
            </label>

            {/* Convert Button */}
            <button
              onClick={handlesubmit}
              disabled={!selectedFile || isLoading}
              className={`w-full max-w-sm py-3 rounded-lg shadow-lg transition duration-300 ${
                selectedFile && !isLoading
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isLoading ? "Converting..." : "Convert File"}
            </button>

            {/* Messages */}
            {convert && <div className="text-green-500 text-center">{convert}</div>}
            {downloadError && (
              <div className="text-red-500 text-center">
                {downloadError}{" "}
                <button
                  onClick={() => {
                    setDownloadError(null);
                    setSelectedFile(null);
                  }}
                  className="text-blue-500 text-sm underline"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
