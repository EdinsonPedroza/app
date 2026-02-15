import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, FileText, Calendar, Clock, Lock, Unlock } from 'lucide-react';
import api from '@/lib/api';

export default function TeacherActivities() {
  const { courseId } = useParams();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', due_date: '' });
  const [saving, setSaving] = useState(false);

  const fetchActivities = useCallback(async () => {
    try {
      const res = await api.get(`/activities?course_id=${courseId}`);
      setActivities(res.data);
    } catch (err) {
      toast.error('Error cargando actividades');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  const openCreate = () => {
    setEditing(null);
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    setForm({ title: '', description: '', due_date: defaultDate.toISOString().slice(0, 16) });
    setDialogOpen(true);
  };

  const openEdit = (act) => {
    setEditing(act);
    setForm({
      title: act.title,
      description: act.description || '',
      due_date: act.due_date ? new Date(act.due_date).toISOString().slice(0, 16) : ''
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.due_date) { toast.error('Título y fecha requeridos'); return; }
    setSaving(true);
    try {
      const dueDate = new Date(form.due_date).toISOString();
      if (editing) {
        await api.put(`/activities/${editing.id}`, { title: form.title, description: form.description, due_date: dueDate });
        toast.success('Actividad actualizada');
      } else {
        await api.post('/activities', { course_id: courseId, title: form.title, description: form.description, due_date: dueDate });
        toast.success('Actividad creada');
      }
      setDialogOpen(false);
      fetchActivities();
    } catch (err) {
      toast.error('Error guardando actividad');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta actividad?')) return;
    try { await api.delete(`/activities/${id}`); toast.success('Actividad eliminada'); fetchActivities(); }
    catch (err) { toast.error('Error eliminando actividad'); }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <DashboardLayout courseId={courseId}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-heading">Actividades</h1>
            <p className="text-muted-foreground mt-1">Crea y gestiona las actividades del curso</p>
          </div>
          <Button onClick={openCreate}><Plus className="h-4 w-4" /> Nueva Actividad</Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : activities.length === 0 ? (
          <Card className="shadow-card"><CardContent className="p-10 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No hay actividades creadas</p>
            <Button className="mt-4" onClick={openCreate}><Plus className="h-4 w-4" /> Crear Actividad</Button>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {activities.map((act) => {
              const due = new Date(act.due_date);
              const now = new Date();
              const isOverdue = due < now;
              const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

              return (
                <Card key={act.id} className="shadow-card hover:shadow-card-hover transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {isOverdue ? <Lock className="h-4 w-4 text-destructive" /> : <Unlock className="h-4 w-4 text-success" />}
                          <h3 className="text-sm font-semibold text-foreground">{act.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{act.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Vence: {formatDate(act.due_date)}</span>
                          {!isOverdue && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {daysLeft} días restantes</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={isOverdue ? 'destructive' : 'success'}>
                          {isOverdue ? 'Bloqueada' : 'Activa'}
                        </Badge>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(act)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(act.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Actividad' : 'Nueva Actividad'}</DialogTitle>
            <DialogDescription>Las actividades se bloquean automáticamente al pasar la fecha límite</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Título</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Nombre de la actividad" /></div>
            <div className="space-y-2"><Label>Descripción</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Instrucciones de la actividad..." rows={4} /></div>
            <div className="space-y-2"><Label>Fecha Límite</Label><Input type="datetime-local" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />}{editing ? 'Actualizar' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
