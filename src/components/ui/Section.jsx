function Section({ title, icon, headerRight, children }) {
    return (
        <section className="section">
            <div className="section-head">
                <div className="section-title">
                    {icon}
                    <h2>{title}</h2>
                </div>
                {headerRight}
            </div>
            {children}
        </section>
    );
}

export default Section;

