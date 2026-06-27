import { memo } from "react";

function Section({ title, icon, headerRight, children }) {
    return (
        <section className="section" aria-labelledby={`section-${title.replace(/\s+/g, "-").toLowerCase()}`}>
            <div className="section-head">
                <div className="section-title">
                    {icon && <span aria-hidden="true">{icon}</span>}
                    <h2 id={`section-${title.replace(/\s+/g, "-").toLowerCase()}`}>{title}</h2>
                </div>
                {headerRight}
            </div>
            {children}
        </section>
    );
}

export default memo(Section);

