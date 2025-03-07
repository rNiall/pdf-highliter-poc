import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

import {
  AreaHighlight,
  Highlight,
  PdfHighlighter,
  PdfLoader,
  Popup,
  Tip,
} from "react-pdf-highlighter";
import { Sidebar } from "./Sidebar";
import { Spinner } from "./Spinner";

const testHighlights = [];

const getNextId = () => String(Math.random()).slice(2);

const parseIdFromHash = () =>
  document.location.hash.slice("#highlight-".length);

const resetHash = () => {
  document.location.hash = "";
};

// Helper function to format the filename by removing numeric prefix
const formatDisplayFilename = (filename) => {
  // Check if filename matches the pattern "digits-filename.pdf"
  const match = filename.match(/^\d+-(.+)$/);
  if (match) {
    // Return only the portion after the digits and dash
    return match[1];
  }
  // If it doesn't match the pattern, return the original filename
  return filename;
};

const HighlightPopup = ({
  comment,
}) =>
  comment.text ? (
    <div className="Highlight__popup">
      {comment.emoji} {comment.text}
    </div>
  ) : null;

export default function App() {
  const { filename } = useParams();
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [highlights, setHighlights] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Format the display filename
  const displayFilename = filename ? formatDisplayFilename(decodeURIComponent(filename)) : '';
  
  // Load the PDF URL
  useEffect(() => {
    if (filename) {
      const url = `http://localhost:5000/uploads/${filename}`;
      setUrl(url);
    }
  }, [filename]);
  
  // Load highlights from the server when component mounts or filename changes
  useEffect(() => {
    const fetchHighlights = async () => {
      if (!filename) return;
      
      try {
        setIsLoading(true);
        const response = await axios.get(
          `http://localhost:5000/api/highlights/${encodeURIComponent(filename)}`
        );
        
        if (response.data && Array.isArray(response.data)) {
          setHighlights(response.data);
        }
      } catch (error) {
        console.error("Error fetching highlights:", error);
        // If there's an error, we'll just use empty highlights
        setHighlights([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHighlights();
  }, [filename]);
  
  // Save highlights to server whenever they change
  useEffect(() => {
    const saveHighlights = async () => {
      if (!filename || isLoading) return;
      
      try {
        await axios.post(
          `http://localhost:5000/api/highlights/${encodeURIComponent(filename)}`,
          highlights
        );
        console.log("Highlights saved successfully");
      } catch (error) {
        console.error("Error saving highlights:", error);
      }
    };
    
    // Only save if we have highlights and we're not in the initial loading state
    if (highlights.length > 0 && !isLoading) {
      saveHighlights();
    }
  }, [highlights, filename, isLoading]);
  
  // Navigate to home page
  const goToHomePage = () => {
    navigate('/');
  };
  
  const resetHighlights = async () => {
    setHighlights([]);
    try {
      await axios.post(
        `http://localhost:5000/api/highlights/${encodeURIComponent(filename)}`,
        []
      );
      console.log("Highlights cleared successfully");
    } catch (error) {
      console.error("Error clearing highlights:", error);
    }
  };

  const toggleDocument = () => {
    const newUrl =
      "url === PRIMARY_PDF_URL ? SECONDARY_PDF_URL : PRIMARY_PDF_URL";
    setUrl(newUrl);
    setHighlights(testHighlights[newUrl] ? [...testHighlights[newUrl]] : []);
  };

  const scrollViewerTo = useRef((highlight) => {});

  const scrollToHighlightFromHash = useCallback(() => {
    const highlight = getHighlightById(parseIdFromHash());
    if (highlight) {
      scrollViewerTo.current(highlight);
    }
  }, [highlights]); // Add highlights as a dependency

  useEffect(() => {
    window.addEventListener("hashchange", scrollToHighlightFromHash, false);
    return () => {
      window.removeEventListener(
        "hashchange",
        scrollToHighlightFromHash,
        false,
      );
    };
  }, [scrollToHighlightFromHash]);

  const getHighlightById = (id) => {
    return highlights.find((highlight) => highlight.id === id);
  };

  const addHighlight = (highlight) => {
    console.log("Saving highlight", highlight);
    setHighlights((prevHighlights) => [
      { ...highlight, id: getNextId() },
      ...prevHighlights,
    ]);
  };

  const updateHighlight = (
    highlightId,
    position,
    content,
  ) => {
    console.log("Updating highlight", highlightId, position, content);
    setHighlights((prevHighlights) =>
      prevHighlights.map((h) => {
        const {
          id,
          position: originalPosition,
          content: originalContent,
          ...rest
        } = h;
        return id === highlightId
          ? {
              id,
              position: { ...originalPosition, ...position },
              content: { ...originalContent, ...content },
              ...rest,
            }
          : h;
      }),
    );
  };

  if (!filename) {
    return <div>No file selected</div>;
  }

  return (
    <div className="App" style={{ display: "flex", height: "100vh", flexDirection: "column" }}>
      {/* Header with Home button */}
      <div style={{ 
        display: "flex", 
        padding: "10px", 
        backgroundColor: "#f5f5f5", 
        alignItems: "center",
        borderBottom: "1px solid #ddd"
      }}>
        <button 
          onClick={goToHomePage}
          style={{
            padding: "8px 16px",
            backgroundColor: "#4285f4",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center"
          }}
        >
          <span style={{ marginRight: "5px" }}>←</span> Home
        </button>
        <h2 style={{ margin: "0 0 0 15px", color: 'black' }}>
          {displayFilename}
        </h2>
      </div>
      
      {/* Main content */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar
          highlights={highlights}
          resetHighlights={resetHighlights}
          toggleDocument={toggleDocument}
        />
        <div
          style={{
            height: "100%",
            width: "75vw",
            position: "relative",
          }}
        >
          {isLoading ? (
            <Spinner />
          ) : (
            <PdfLoader url={url} beforeLoad={<Spinner />}>
              {(pdfDocument) => (
                <PdfHighlighter
                  pdfDocument={pdfDocument}
                  enableAreaSelection={(event) => event.altKey}
                  onScrollChange={resetHash}
                  scrollRef={(scrollTo) => {
                    scrollViewerTo.current = scrollTo;
                    scrollToHighlightFromHash();
                  }}
                  onSelectionFinished={(
                    position,
                    content,
                    hideTipAndSelection,
                    transformSelection,
                  ) => (
                    <Tip
                      onOpen={transformSelection}
                      onConfirm={(comment) => {
                        addHighlight({ content, position, comment });
                        hideTipAndSelection();
                      }}
                    />
                  )}
                  highlightTransform={(
                    highlight,
                    index,
                    setTip,
                    hideTip,
                    viewportToScaled,
                    screenshot,
                    isScrolledTo,
                  ) => {
                    const isTextHighlight = !highlight.content?.image;

                    const component = isTextHighlight ? (
                      <Highlight
                        isScrolledTo={isScrolledTo}
                        position={highlight.position}
                        comment={highlight.comment}
                      />
                    ) : (
                      <AreaHighlight
                        isScrolledTo={isScrolledTo}
                        highlight={highlight}
                        onChange={(boundingRect) => {
                          updateHighlight(
                            highlight.id,
                            { boundingRect: viewportToScaled(boundingRect) },
                            { image: screenshot(boundingRect) },
                          );
                        }}
                      />
                    );

                    return (
                      <Popup
                        popupContent={<HighlightPopup {...highlight} />}
                        onMouseOver={(popupContent) =>
                          setTip(highlight, (highlight) => popupContent)
                        }
                        onMouseOut={hideTip}
                        key={index}
                      >
                        {component}
                      </Popup>
                    );
                  }}
                  highlights={highlights}
                />
              )}
            </PdfLoader>
          )}
        </div>
      </div>
    </div>
  );
}