"use client";
import { useState, useEffect } from "react";
import { FileText, Plus, Trash2, Edit2, Copy, Save, AlertCircle } from "lucide-react";
import { App } from "antd";
import { databaseService } from "@/services/databaseService";

export default function CriteriaTemplatesPage() {
  const { message } = App.useApp();
  const [templates, setTemplates] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setTemplates(databaseService.getCriteriaTemplates());
  };

  const handleAddNew = () => {
    setEditingTemplate({
      id: `CT-${Date.now()}`,
      name: "",
      totalWeight: 100,
      usageCount: 0,
      status: "Active",
      items: [
        { key: `C-${Date.now()}-1`, name: "", weight: 100, desc: "" }
      ]
    });
    setIsEditing(true);
  };

  const handleEdit = (template: any) => {
    setEditingTemplate(JSON.parse(JSON.stringify(template)));
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    databaseService.deleteCriteriaTemplate(id);
    loadData();
    message.success("Template deleted.");
  };

  const handleClone = (template: any) => {
    const clone = JSON.parse(JSON.stringify(template));
    clone.id = `CT-${Date.now()}`;
    clone.name = `${clone.name} (Copy)`;
    databaseService.addCriteriaTemplate(clone);
    loadData();
    message.success("Template cloned.");
  };

  const handleSave = () => {
    if (!editingTemplate.name.trim()) return message.error("Template name is required.");
    
    // Validate total weight
    const total = editingTemplate.items.reduce((sum: number, item: any) => sum + Number(item.weight), 0);
    if (total !== 100) {
      return message.error(`Total weight must be exactly 100%. Current: ${total}%`);
    }

    const exists = templates.some(t => t.id === editingTemplate.id);
    if (exists) {
      databaseService.updateCriteriaTemplate(editingTemplate);
    } else {
      databaseService.addCriteriaTemplate(editingTemplate);
    }
    
    loadData();
    setIsEditing(false);
    message.success("Template saved successfully.");
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = { ...editingTemplate };
    updated.items[index][field] = value;
    
    // Auto calculate total weight
    updated.totalWeight = updated.items.reduce((sum: number, item: any) => sum + Number(item.weight || 0), 0);
    setEditingTemplate(updated);
  };

  const addItem = () => {
    const updated = { ...editingTemplate };
    updated.items.push({ key: `C-${Date.now()}`, name: "", weight: 0, desc: "" });
    setEditingTemplate(updated);
  };

  const removeItem = (index: number) => {
    const updated = { ...editingTemplate };
    updated.items.splice(index, 1);
    updated.totalWeight = updated.items.reduce((sum: number, item: any) => sum + Number(item.weight || 0), 0);
    setEditingTemplate(updated);
  };

  return (
    <div style={{ maxWidth: 1000 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={28} /> Scoring Criteria Templates
          </h1>
          <p className="page-subtitle">Manage reusable grading rubrics for events</p>
        </div>
        {!isEditing && (
          <button className="btn btn-primary" onClick={handleAddNew}>
            <Plus size={16} /> New Template
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="glass-card" style={{ animation: "modal-in 0.3s ease" }}>
          <h3 style={{ marginBottom: "1.5rem" }}>{editingTemplate.name ? "Edit Template" : "Create New Template"}</h3>
          
          <div className="form-group" style={{ marginBottom: "1.5rem" }}>
            <label className="form-label">Template Name</label>
            <input 
              className="form-input" 
              placeholder="e.g. Standard AI Hackathon Rubric" 
              value={editingTemplate.name}
              onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})}
            />
          </div>

          <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1.5rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h4 style={{ color: "var(--color-text)" }}>Criteria Breakdown</h4>
              <span className={`badge ${editingTemplate.totalWeight === 100 ? 'badge-success' : 'badge-danger'}`}>
                Total Weight: {editingTemplate.totalWeight}%
              </span>
            </div>

            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Criterion Name</th>
                    <th>Description</th>
                    <th style={{ width: 100 }}>Weight (%)</th>
                    <th style={{ width: 60 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {editingTemplate.items.map((item: any, index: number) => (
                    <tr key={item.key}>
                      <td>
                        <input className="form-input" placeholder="e.g. Innovation" value={item.name} onChange={(e) => updateItem(index, 'name', e.target.value)} />
                      </td>
                      <td>
                        <input className="form-input" placeholder="e.g. Originality of the idea" value={item.desc} onChange={(e) => updateItem(index, 'desc', e.target.value)} />
                      </td>
                      <td>
                        <input className="form-input" type="number" min="0" max="100" value={item.weight} onChange={(e) => updateItem(index, 'weight', e.target.value)} />
                      </td>
                      <td>
                        <button className="btn btn-icon btn-danger" style={{ background: "transparent", color: "var(--color-rose)" }} onClick={() => removeItem(index)}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <button className="btn btn-secondary btn-sm" style={{ marginTop: "1rem" }} onClick={addItem}>
              <Plus size={14} /> Add Criterion
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
            <button className="btn btn-ghost" onClick={() => setIsEditing(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>
              <Save size={16} /> Save Template
            </button>
          </div>
        </div>
      ) : (
        <div className="grid-2">
          {templates.map(template => (
            <div key={template.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{template.name}</h3>
                  <span className="badge badge-neutral">Used in {template.usageCount} events</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-icon btn-secondary" onClick={() => handleEdit(template)} title="Edit">
                    <Edit2 size={14} />
                  </button>
                  <button className="btn btn-icon btn-secondary" onClick={() => handleClone(template)} title="Clone">
                    <Copy size={14} />
                  </button>
                  <button className="btn btn-icon btn-danger" style={{ background: "transparent", color: "var(--color-rose)" }} onClick={() => handleDelete(template.id)} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              
              <div style={{ flex: 1, background: "var(--color-surface-2)", borderRadius: "var(--radius-md)", padding: "1rem", border: "1px solid var(--color-border-2)" }}>
                <h4 style={{ fontSize: "0.85rem", color: "var(--color-text-3)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Criteria Breakdown</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {template.items.map((item: any, idx: number) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.9rem" }}>
                      <span style={{ color: "var(--color-text)" }}>{item.name}</span>
                      <span className="badge badge-primary">{item.weight}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
