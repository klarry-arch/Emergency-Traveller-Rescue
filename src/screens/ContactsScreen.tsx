/**
 * Emergency Contacts Screen — Add/edit/delete contacts
 */

import { useState } from 'react';
import type { EmergencyContact } from '../types';
import { generateId } from '../services/storageService';
import { callContact, sendSMSToContact, generateShortMessage } from '../services/sosService';
import { useGPS } from '../hooks';

interface ContactsScreenProps {
  contacts: EmergencyContact[];
  onUpdateContacts: (contacts: EmergencyContact[]) => void;
  onBack: () => void;
  fromWelcome?: boolean;
}

export default function ContactsScreen({
  contacts,
  onUpdateContacts,
  onBack,
  fromWelcome,
}: ContactsScreenProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');
  const { position } = useGPS(false);

  const handleAdd = () => {
    if (!name.trim() || !phone.trim()) return;
    
    const newContact: EmergencyContact = {
      id: generateId(),
      name: name.trim(),
      phone: phone.trim(),
      relationship: relationship.trim() || 'Other',
      isPrimary: contacts.length === 0,
    };

    onUpdateContacts([...contacts, newContact]);
    resetForm();
  };

  const handleUpdate = () => {
    if (!editingId || !name.trim() || !phone.trim()) return;

    onUpdateContacts(
      contacts.map((c) =>
        c.id === editingId
          ? { ...c, name: name.trim(), phone: phone.trim(), relationship: relationship.trim() || 'Other' }
          : c
      )
    );
    resetForm();
  };

  const handleDelete = (id: string) => {
    onUpdateContacts(contacts.filter((c) => c.id !== id));
  };

  const handleSetPrimary = (id: string) => {
    onUpdateContacts(
      contacts.map((c) => ({ ...c, isPrimary: c.id === id }))
    );
  };

  const startEdit = (contact: EmergencyContact) => {
    setEditingId(contact.id);
    setName(contact.name);
    setPhone(contact.phone);
    setRelationship(contact.relationship);
    setIsAdding(true);
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setName('');
    setPhone('');
    setRelationship('');
  };

  return (
    <div className="screen">
      {/* Header */}
      <div className="nav-bar" style={{ margin: 'calc(-1 * var(--space-4))', marginBottom: 'var(--space-4)', position: 'static' }}>
        <button className="nav-bar__back" onClick={onBack}>← Back</button>
        <span className="nav-bar__title">👥 Emergency Contacts</span>
        <div />
      </div>

      {fromWelcome && (
        <div className="safety-alert safety-alert--info" style={{ marginBottom: 'var(--space-4)' }}>
          <span className="safety-alert__icon">ℹ️</span>
          <span className="safety-alert__text">
            Add people who should be contacted if you're in an emergency. 
            These contacts will receive your location when you use the SOS feature.
          </span>
        </div>
      )}

      {/* Contact List */}
      {contacts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          {contacts.map((contact) => (
            <div key={contact.id} className="contact-card">
              <div className="contact-card__avatar">
                {contact.name.charAt(0).toUpperCase()}
              </div>
              <div className="contact-card__info">
                <div className="contact-card__name">
                  {contact.name}
                  {contact.isPrimary && (
                    <span style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-safety-green)',
                      marginLeft: 'var(--space-2)',
                      fontWeight: 600,
                    }}>
                      ★ Primary
                    </span>
                  )}
                </div>
                <div className="contact-card__phone">{contact.phone}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                  {contact.relationship}
                </div>
              </div>
              <div className="contact-card__actions">
                <button className="btn btn--ghost btn--icon" onClick={() => callContact(contact.phone)} title="Call">📞</button>
                <button className="btn btn--ghost btn--icon" onClick={() => sendSMSToContact(contact.phone, generateShortMessage(position))} title="SMS">💬</button>
                <button className="btn btn--ghost btn--icon" onClick={() => startEdit(contact)} title="Edit">✏️</button>
                <button className="btn btn--ghost btn--icon" onClick={() => handleDelete(contact.id)} title="Delete">🗑️</button>
              </div>
            </div>
          ))}

          {/* Set Primary */}
          {contacts.length > 1 && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
              Tap ★ to set primary contact. 
              {contacts.filter((c) => !c.isPrimary).map((c) => (
                <button
                  key={c.id}
                  style={{ color: 'var(--color-forest-400)', marginLeft: 'var(--space-2)', cursor: 'pointer', background: 'none', border: 'none', fontSize: 'var(--text-xs)' }}
                  onClick={() => handleSetPrimary(c.id)}
                >
                  Set {c.name} as primary
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Form */}
      {isAdding ? (
        <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
          <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-4)' }}>
            {editingId ? 'Edit Contact' : 'Add Contact'}
          </h3>
          
          <div className="form-group">
            <label className="form-group__label">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contact name"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-group__label">Phone *</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 234 567 8900"
            />
          </div>

          <div className="form-group">
            <label className="form-group__label">Relationship</label>
            <input
              type="text"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              placeholder="Family, Friend, Guide, etc."
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button className="btn btn--primary btn--full" onClick={editingId ? handleUpdate : handleAdd}>
              {editingId ? 'Update' : 'Add Contact'}
            </button>
            <button className="btn btn--outline btn--full" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          className="btn btn--outline btn--lg btn--full"
          onClick={() => setIsAdding(true)}
        >
          ➕ Add Emergency Contact
        </button>
      )}

      {/* Empty State */}
      {contacts.length === 0 && !isAdding && (
        <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-3)' }}>👥</div>
          <p>No emergency contacts added yet.</p>
          <p style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
            Add contacts who should be notified in an emergency.
          </p>
        </div>
      )}
    </div>
  );
}
