import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Loader2, ClipboardList, Save, Check } from 'lucide-react';
import api from '@/lib/api';

export default function TeacherGrades() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [activities, setActivities] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState('general');
  const [editedGrades, setEditedGrades] = useState({});
  const [savingGrade, setSavingGrade] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [cRes, aRes, gRes, uRes] = await Promise.all([
        api.get(`/courses/${courseId}`),
        api.get(`/activities?course_id=${courseId}`),
        api.get(`/grades?course_id=${courseId}`),
        api.get('/users?role=estudiante')
      ]);
      setCourse(cRes.data);
      setActivities(aRes.data);
      setGrades(gRes.data);
      const courseStudents = uRes.data.filter(u => (cRes.data.student_ids || []).includes(u.id));
      setStudents(courseStudents);
    } catch (err) {
      toast.error('Error cargando datos');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getGrade = (studentId, activityId) => {
    const key = `${studentId}-${activityId || 'general'}`;
    if (editedGrades[key] !== undefined) return editedGrades[key];
    const grade = grades.find(g => g.student_id === studentId && (g.activity_id || 'general') === (activityId || 'general'));
    return grade ? grade.value : '';
  };

  const getGradeComment = (studentId, activityId) => {
    const grade = grades.find(g => g.student_id === studentId && (g.activity_id || 'general') === (activityId || 'general'));
    return grade?.comments || '';
  };

  const handleGradeChange = (studentId, activityId, value) => {
    const key = `${studentId}-${activityId || 'general'}`;
    setEditedGrades(prev => ({ ...prev, [key]: value }));
  };

  const saveGrade = async (studentId, activityId) => {
    const key = `${studentId}-${activityId || 'general'}`;
    const value = parseFloat(editedGrades[key]);
    if (isNaN(value) || value < 0 || value > 5) {
      toast.error('La nota debe estar entre 0 y 5');
      return;
    }
    setSavingGrade(key);
    try {
      await api.post('/grades', {
        student_id: studentId,
        course_id: courseId,
        activity_id: activityId === 'general' ? null : activityId,
        value,
        comments: ''
      });
      toast.success('Nota guardada');
      const gRes = await api.get(`/grades?course_id=${courseId}`);
      setGrades(gRes.data);
      setEditedGrades(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } catch (err) {
      toast.error('Error guardando nota');
    } finally {
      setSavingGrade(null);
    }
  };

  const initials = (name) => name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

  const getStudentAverage = (studentId) => {
    const studentGrades = grades.filter(g => g.student_id === studentId);
    if (studentGrades.length === 0) return '-';
    const avg = studentGrades.reduce((sum, g) => sum + g.value, 0) / studentGrades.length;
    return avg.toFixed(1);
  };

  return (
    <DashboardLayout courseId={courseId}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-heading">Notas</h1>
          <p className="text-muted-foreground mt-1">Califica y modifica las notas de los estudiantes</p>
        </div>

        <div className="flex items-center gap-4">
          <Select value={selectedActivity} onValueChange={setSelectedActivity}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Seleccionar actividad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">Nota General</SelectItem>
              {activities.map(a => <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>)}
            </SelectContent>
          </Select>
          <Badge variant="secondary">{students.length} estudiantes</Badge>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : students.length === 0 ? (
          <Card className="shadow-card"><CardContent className="p-10 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No hay estudiantes inscritos en este curso</p>
          </CardContent></Card>
        ) : (
          <Card className="shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-48">Estudiante</TableHead>
                    <TableHead>Cédula</TableHead>
                    <TableHead className="min-w-32">Nota ({selectedActivity === 'general' ? 'General' : 'Actividad'})</TableHead>
                    <TableHead>Promedio</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s) => {
                    const key = `${s.id}-${selectedActivity}`;
                    const currentValue = getGrade(s.id, selectedActivity === 'general' ? null : selectedActivity);
                    const isEdited = editedGrades[key] !== undefined;
                    const isSaving = savingGrade === key;
                    const avg = getStudentAverage(s.id);

                    return (
                      <TableRow key={s.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials(s.name)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">{s.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">{s.cedula}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="5"
                            step="0.1"
                            className="w-24 h-8"
                            value={currentValue}
                            onChange={(e) => handleGradeChange(s.id, selectedActivity === 'general' ? null : selectedActivity, e.target.value)}
                            placeholder="0-5"
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant={avg !== '-' && parseFloat(avg) >= 3 ? 'success' : avg !== '-' ? 'destructive' : 'secondary'}>
                            {avg}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant={isEdited ? 'default' : 'outline'}
                            disabled={!isEdited || isSaving}
                            onClick={() => saveGrade(s.id, selectedActivity === 'general' ? null : selectedActivity)}
                          >
                            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : isEdited ? <Save className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                            {isEdited ? 'Guardar' : 'Guardada'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
