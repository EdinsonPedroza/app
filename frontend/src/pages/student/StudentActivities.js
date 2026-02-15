import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, FileText, Calendar, Clock, Lock, Unlock, Send, Download, File, TimerOff, Upload, Trash2, Image } from 'lucide-react';
import api from '@/lib/api';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function StudentActivities() {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitDialog, setSubmitDialog] = useState(null);
  const [submitContent, setSubmitContent] = useState('');
  const [submitFiles, setSubmitFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const cRes = await api.get(`/courses?student_id=${user.id}`);
      const allActivities = [];
      for (const course of cRes.data) {
        const aRes = await api.get(`/activities?course_id=${course.id}`);
        allActivities.push(...aRes.data.map(a => ({ ...a, courseName: course.name })));
      }
      setActivities(allActivities);
      const sRes = await api.get(`/submissions?student_id=${user.id}`);
      setSubmissions(sRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const hasSubmission = (actId) => submissions.find(s => s.activity_id === actId);

  const getActivityStatus = (act) => {
    const now = new Date();
    const due = new Date(act.due_date);
    const start = act.start_date ? new Date(act.start_date) : null;

    if (now > due) return { key: 'expired', label: 'Bloqueada (Vencida)', variant: 'destructive', icon: Lock };
    if (start && now < start) return { key: 'upcoming', label: 'No Disponible', variant: 'secondary', icon: TimerOff };
    return { key: 'active', label: 'Activa', variant: 'success', icon: Unlock };
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setUploadingFile(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSubmitFiles(prev => [...prev, { name: res.data.filename, url: `${BACKEND_URL}${res.data.url}` }]);
      }
      toast.success(`${files.length} archivo(s) subido(s)`);
    } catch (err) {
      toast.error('Error subiendo archivo');
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const removeSubmitFile = (index) => {
    setSubmitFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!submitContent.trim() && submitFiles.length === 0) { toast.error('Escribe una respuesta o adjunta archivos'); return; }
    setSubmitting(true);
    try {
      await api.post('/submissions', { activity_id: submitDialog.id, content: submitContent, files: submitFiles });
      toast.success('Actividad entregada exitosamente');
      setSubmitDialog(null);
      setSubmitContent('');
      setSubmitFiles([]);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error entregando actividad');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-heading">Actividades</h1>
          <p className="text-muted-foreground mt-1">Tus actividades pendientes y entregadas</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : activities.length === 0 ? (
          <Card className="shadow-card"><CardContent className="p-10 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No hay actividades disponibles</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {activities.map((act) => {
              const status = getActivityStatus(act);
              const due = new Date(act.due_date);
              const start = act.start_date ? new Date(act.start_date) : null;
              const now = new Date();
              const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
              const submission = hasSubmission(act.id);
              const StatusIcon = status.icon;
              const actNum = act.activity_number || '?';

              return (
                <Card key={act.id} className={`shadow-card transition-shadow ${status.key !== 'active' && !submission ? 'opacity-70' : 'hover:shadow-card-hover'}`}>
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="shrink-0 text-xs font-mono">Act {actNum}</Badge>
                          <StatusIcon className={`h-4 w-4 shrink-0 ${status.variant === 'destructive' ? 'text-destructive' : status.variant === 'success' ? 'text-success' : 'text-muted-foreground'}`} />
                          <h3 className="text-sm font-semibold truncate">{act.title}</h3>
                        </div>
                        <p className="text-xs text-primary mb-2">{act.courseName}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{act.description}</p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          {start && (
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Disponible: {formatDate(act.start_date)}</span>
                          )}
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Vence: {formatDate(act.due_date)}</span>
                          {status.key === 'active' && daysLeft > 0 && (
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {daysLeft} días restantes</span>
                          )}
                          {status.key === 'upcoming' && start && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Disponible en {Math.ceil((start - now) / (1000 * 60 * 60 * 24))} días
                            </span>
                          )}
                        </div>

                        {/* Attached files */}
                        {act.files && act.files.length > 0 && (
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {act.files.map((f, i) => (
                              <a
                                key={i}
                                href={f.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-primary hover:underline bg-primary/5 rounded-md px-2 py-1"
                              >
                                <File className="h-3 w-3" />
                                {f.name}
                                <Download className="h-3 w-3" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {submission ? (
                          <Badge variant="success">Entregada</Badge>
                        ) : status.key === 'active' ? (
                          <Button size="sm" onClick={() => { setSubmitDialog(act); setSubmitContent(''); }}>
                            <Send className="h-3 w-3" /> Entregar
                          </Button>
                        ) : (
                          <Badge variant={status.variant}>{status.label}</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!submitDialog} onOpenChange={() => setSubmitDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Entregar Actividad</DialogTitle>
            <DialogDescription>{submitDialog?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm text-muted-foreground">{submitDialog?.description}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tu Respuesta</label>
              <Textarea
                value={submitContent}
                onChange={(e) => setSubmitContent(e.target.value)}
                placeholder="Escribe tu respuesta aquí..."
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitDialog(null)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <Send className="h-4 w-4" /> Entregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
