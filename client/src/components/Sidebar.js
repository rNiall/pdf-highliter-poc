const updateHash = (highlight) => {
    console.log(highlight);
    document.location.hash = `highlight-${highlight.id}`;
  };
  
  export function Sidebar({
    highlights,
    toggleDocument,
    resetHighlights,
  }) {
    return (
      <div className="sidebar" style={{ width: "25vw" }}>
        <div className="description" style={{ padding: "1rem" }}>
          <h2 style={{ marginBottom: "1rem" }}>
            react-pdf-highlighter 
          </h2>  
          <p>
            <small>
              To create area highlight hold ⌥ Option key (Alt), then click and
              drag.
            </small>
          </p>
        </div>
  
        <ul className="sidebar__highlights">
          {highlights.map((highlight, index) => (
            <li
              // biome-ignore lint/suspicious/noArrayIndexKey: This is an example app
              key={index}
              className="sidebar__highlight"
              onClick={() => {
                updateHash(highlight);
              }}
            >
              <div>
                <strong>{highlight.comment.text}</strong>
                {highlight.content.text ? (
                  <blockquote style={{ marginTop: "0.5rem" }}>
                    {`${highlight.content.text.slice(0, 90).trim()}…`}
                  </blockquote>
                ) : null}
                {highlight.content.image ? (
                  <div
                    className="highlight__image"
                    style={{ marginTop: "0.5rem" }}
                  >
                    <img src={highlight.content.image} alt={"Screenshot"} />
                  </div>
                ) : null}
              </div>
              <div className="highlight__location">
                Page {highlight.position.pageNumber}
              </div>
            </li>
          ))}
        </ul>
        {highlights.length > 0 ? (
          <div style={{ padding: "1rem" }}>
            <button type="button" onClick={resetHighlights}>
              Reset highlights
            </button>
          </div>
        ) : null}
      </div>
    );
  }