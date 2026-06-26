import { Leaf } from "lucide-react";

function FatBenchmarkCard({ visibleFatLimit, profile }) {
    return (
        <div className="pro-card">
            <div className="pro-card-header">
                <div className="pro-card-icon" style={{ background: "#fff7ed", color: "#ea580c" }}>
                    <Leaf size={16} />
                </div>
                <h2>Daily Fat Benchmark</h2>
            </div>
            <div className="pro-card-body">
                <div className="pro-fat-display">
                    <div className="pro-fat-value">
                        <strong>{visibleFatLimit}</strong>
                        <span>g / day</span>
                    </div>
                    <div className="pro-fat-meta">
                        <span className="pro-fat-tag">{profile.sex}</span>
                        <span className="pro-fat-tag">{profile.activity}</span>
                    </div>
                </div>
                <p className="pro-muted" style={{ marginTop: 12 }}>
                    Visible fat intake benchmark based on your sex and activity level.
                </p>
            </div>
        </div>
    );
}

export default FatBenchmarkCard;

