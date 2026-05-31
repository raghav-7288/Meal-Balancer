import { useState, useEffect } from "react";
import { getMajorGroups } from "../services/databaseService";

function SupabaseTest() {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchGroups() {
            try {
                setLoading(true);
                setError(null);
                const data = await getMajorGroups();
                setGroups(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchGroups();
    }, []);

    if (loading) {
        return (
            <div className="supabase-test">
                <h2>Supabase Connection Test</h2>
                <div className="test-loading">Loading major groups…</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="supabase-test">
                <h2>Supabase Connection Test</h2>
                <div className="test-error">
                    <strong>Error:</strong> {error}
                </div>
            </div>
        );
    }

    return (
        <div className="supabase-test">
            <h2>Supabase Connection Test</h2>
            <p className="test-success">
                ✓ Connected — {groups.length} major group(s) loaded
            </p>
            <div className="test-table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Group Name</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groups.map((g) => (
                            <tr key={g.major_group_id}>
                                <td>{g.group_code}</td>
                                <td>{g.group_name}</td>
                            </tr>
                        ))}
                        {groups.length === 0 && (
                            <tr>
                                <td colSpan={2} className="empty-cell">
                                    No major groups found in the database.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default SupabaseTest;

