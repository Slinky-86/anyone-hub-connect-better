import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonLabel,
  IonCheckbox,
  IonFab,
  IonFabButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonSkeletonText,
  IonText,
  IonButtons,
  IonBackButton
} from '@ionic/react';
import { add } from 'ionicons/icons';
import { supabase } from '@/lib/supabase-unified';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
  user_id?: string;
}

const MobileTodos: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTodos();
  }, []);

  const getTodos = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setTodos(data as Todo[]);
      }
    } catch (error: any) {
      console.error('Error fetching todos:', error.message);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRefresh = async (event: CustomEvent) => {
    await getTodos();
    event.detail.complete();
  };
  
  const toggleTodoCompleted = async (todo: Todo) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ completed: !todo.completed })
        .eq('id', todo.id);
        
      if (error) throw error;
      
      // Update local state
      setTodos(prev => 
        prev.map(t => t.id === todo.id ? { ...t, completed: !t.completed } : t)
      );
    } catch (error: any) {
      console.error('Error updating todo:', error.message);
    }
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/messaging" />
            </IonButtons>
            <IonTitle>Todos</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonCard>
            <IonCardContent>
              <IonSkeletonText animated style={{ width: '100%' }} />
              <IonSkeletonText animated style={{ width: '80%' }} />
              <IonSkeletonText animated style={{ width: '60%' }} />
            </IonCardContent>
          </IonCard>
          <IonCard>
            <IonCardContent>
              <IonSkeletonText animated style={{ width: '100%' }} />
              <IonSkeletonText animated style={{ width: '80%' }} />
            </IonCardContent>
          </IonCard>
        </IonContent>
      </IonPage>
    );
  }

  if (error) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/messaging" />
            </IonButtons>
            <IonTitle>Todos</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonCard color="danger">
            <IonCardContent>
              <h2 className="font-bold">Error loading todos</h2>
              <p>{error}</p>
              <IonButton onClick={getTodos} className="mt-3">
                Try Again
              </IonButton>
            </IonCardContent>
          </IonCard>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/messaging" />
          </IonButtons>
          <IonTitle>My Todos from Supabase</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>
        
        {todos.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-4">
            <IonText color="medium" className="text-center">
              <p>No todos found</p>
              <p className="text-sm">Create a new todo to get started</p>
            </IonText>
          </div>
        ) : (
          <IonList>
            {todos.map((todo) => (
              <IonItem key={todo.id}>
                <IonCheckbox 
                  slot="start" 
                  checked={todo.completed}
                  onIonChange={() => toggleTodoCompleted(todo)}
                />
                <IonLabel className={todo.completed ? 'line-through text-gray-500' : ''}>
                  {todo.title}
                  <p className="text-xs text-gray-400">
                    {new Date(todo.created_at).toLocaleString()}
                  </p>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        )}
        
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton routerLink="/add-todo">
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

export default MobileTodos;