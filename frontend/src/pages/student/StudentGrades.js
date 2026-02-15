import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ClipboardList, TrendingUp } from 'lucide-react';
import api from '@/lib/api';

export default function StudentGrades() {
  const { user } = useAuth();
  const [grades, setGrades] = useState([]);
  const [courses, setCourses] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [gRes, cRes] = await Promise.all([
        api.get(`/grades?student_id=${user.id}`),
        api.get(`/courses?student_id=${user.id}`)
      ]);
      setGrades(gRes.data);
      setCourses(cRes.data);

      const allActs = [];
      for (const course of cRes.data) {
        const aRes = await api.get(`/activities?course_id=${course.id}`);
        allActs.push(...aRes.data);
      }
      setActivities(allActs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getCourseName = (id) => courses.find(c => c.id === id)?.name || '-';
  const getActivityName = (id) => activities.find(a => a.id === id)?.title || 'Nota General';
  const avgGrade = grades.length > 0 ? (grades.reduce((s, g) => s + g.value, 0) / grades.length).toFixed(1) : '-';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-heading">Mis Notas</h1>
            <p className="text-muted-foreground mt-1">Historial de calificaciones</p>
          </div>
          <Card className="shadow-card">
            <CardContent className="p-4 flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Promedio</p>
                <p className="text-2xl font-bold font-heading">{avgGrade}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : grades.length === 0 ? (
          <Card className="shadow-card"><CardContent className="p-10 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No hay notas registradas aún</p>
          </CardContent></Card>
        ) : (
          <Card className="shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Curso</TableHead>
                    <TableHead>Actividad</TableHead>
                    <TableHead>Nota</TableHead>
                    <TableHead>Comentarios</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell className="text-sm font-medium">{getCourseName(g.course_id)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{getActivityName(g.activity_id)}</TableCell>
                      <TableCell>
                        <Badge variant={g.value >= 3 ? 'success' : 'destructive'} className="text-base px-3">
                          {g.value.toFixed(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-48 truncate">{g.comments || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(g.updated_at || g.created_at).toLocaleDateString('es-CO')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
