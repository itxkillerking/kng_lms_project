import React, { useState, useEffect } from 'react';
import { Card, Button, Input } from '../../components/common/UIComponents';
import { examService } from '../../services/exams';

export const AssignStudentsModal = ({ exam, onClose, onAssigned }) => {
  const [students, setStudents] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assignAll, setAssignAll] = useState(exam.assign_to_all_enrolled || false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = await examService.getCourseStudents(exam.course);
        // data could be paginated or an array
        const results = data.results !== undefined ? data.results : data;
        setStudents(Array.isArray(results) ? results : []);
      } catch (err) {
        console.error("Failed to load students", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [exam.course]);

  const toggleStudent = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredStudents.length) {
      setSelectedIds(new Set());
    } else {
      const newSelected = new Set(filteredStudents.map(s => s.id));
      setSelectedIds(newSelected);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await examService.assignStudents(exam.id, {
        assign_all: assignAll,
        student_ids: Array.from(selectedIds)
      });
      onAssigned();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to save assignments.');
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.username.toLowerCase().includes(search.toLowerCase()) || 
    (s.email && s.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', 
      alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <Card style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3>Assign Students to {exam.title}</h3>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-4)' }}>Course: {exam.course_title}</p>
        
        <div style={{ marginBottom: 'var(--spacing-4)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={assignAll} 
              onChange={(e) => setAssignAll(e.target.checked)} 
            />
            <strong>Assign dynamically to all currently and future enrolled students</strong>
          </label>
        </div>

        {!assignAll && (
          <>
            <Input 
              placeholder="Search by name or email..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
            
            {loading ? (
              <p>Loading students...</p>
            ) : (
              <div style={{ border: '1px solid var(--color-border)', borderRadius: '4px', marginTop: 'var(--spacing-2)' }}>
                <div style={{ padding: '8px', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-background-alt)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.size === filteredStudents.length && filteredStudents.length > 0}
                      onChange={toggleAll}
                    />
                    <strong>Select All</strong>
                  </label>
                </div>
                <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '8px' }}>
                  {filteredStudents.map(student => (
                    <label key={student.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(student.id)}
                        onChange={() => toggleStudent(student.id)}
                      />
                      <span>{student.username} {student.email ? `(${student.email})` : ''}</span>
                    </label>
                  ))}
                  {filteredStudents.length === 0 && <p style={{ color: 'var(--color-text-muted)' }}>No students enrolled.</p>}
                </div>
              </div>
            )}
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-4)' }}>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Assignments'}</Button>
        </div>
      </Card>
    </div>
  );
};
