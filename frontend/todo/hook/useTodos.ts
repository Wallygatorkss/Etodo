"use client";

import { useState, useEffect } from "react";

export type TodoItem = {
  id: number;
  title: string;
  description: string;
  due_time?: string;
  color?: string | null;
  status: "not started" | "todo" | "in progress" | "done";
  container_id?: number | null;
  rewardGemsMin?: number; // borne basse possible
  rewardGemsMax?: number; // borne haute possible
};

export type Column = {
  id: number;
  title: string;
  color?: string | null;
  itemIds: number[];
};

type UseTodosReturn = {
  todos: TodoItem[];
  loading: boolean;
  error: string | null;
  fetchTodos: () => Promise<void>;
  createTodo: (todo: Partial<TodoItem>) => Promise<void>;
  updateTodo: (id: number, todo: Partial<TodoItem>) => Promise<any>;
  deleteTodo: (id: number) => Promise<void>;
  moveTodo: (id: number, container_id: number | null) => Promise<void>;
};

// Redirect to backend login page (serve login.html) — make this configurable if needed
const AUTH_REDIRECT = "http://localhost:3000/login.html";

// Helpers auth partagés
const hasToken = () =>
  typeof document !== "undefined" &&
  document.cookie.split(";").some(c => c.trim().startsWith("token="));

const redirectIfAuthError = (status: number) => {
  if (status === 401 || status === 403 || !hasToken()) {
    if (typeof window !== "undefined") window.location.href = AUTH_REDIRECT;
    return true;
  }
  return false;
};

export function useTodos(): UseTodosReturn {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const API_URL = "http://localhost:3001/todos";

  const notify = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("etodo:todos-updated"));
    }
  };

  const fetchTodos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL, { credentials: "include" });
      if (redirectIfAuthError(res.status)) return;
      if (!res.ok) throw new Error("Impossible de récupérer les todos");
      const data = await res.json();
      setTodos(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const createTodo = async (todo: Partial<TodoItem>) => {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(todo),
      });
      if (redirectIfAuthError(res.status)) return;
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur création todo");
      await fetchTodos();
      notify();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const updateTodo = async (id: number, todo: Partial<TodoItem>) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(todo),
      });
      if (redirectIfAuthError(res.status)) return;
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error((data && data.message) || "Erreur update todo");
      await fetchTodos();
      notify();
      return data;
    } catch (e: any) {
      setError(e.message);
    }
  };

  const deleteTodo = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE", credentials: "include" });
      if (redirectIfAuthError(res.status)) return;
      if (!res.ok) throw new Error("Erreur delete todo");
      setTodos(prev => prev.filter(t => t.id !== id));
      notify();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const moveTodo = async (id: number, container_id: number | null) => {
    try {
      const res = await fetch(`${API_URL}/${id}/move`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ container_id }),
      });
      if (redirectIfAuthError(res.status)) return;
      if (!res.ok) throw new Error("Erreur déplacement todo");
      await fetchTodos();
      notify();
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => {
    if (!hasToken()) {
      window.location.href = AUTH_REDIRECT;
      return;
    }
    fetchTodos();
  }, []);

  return { todos, loading, error, fetchTodos, createTodo, updateTodo, deleteTodo, moveTodo };
}

/* Containers (columns) */

export function useContainers() {
  const [containers, setContainers] = useState<Column[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const BASE_URL = "http://localhost:3001/containers";

  const fetchContainers = async () => {
    setLoading(true);
    try {
      const res = await fetch(BASE_URL, { credentials: "include" });
      if (redirectIfAuthError(res.status)) return;
      if (!res.ok) throw new Error("Impossible de récupérer les containers");
      const data = await res.json();
      setContainers(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteContainer = async (id: number) => {
    try {
      const res = await fetch(`${BASE_URL}/${id}`, { method: "DELETE", credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (redirectIfAuthError(res.status)) return false;
      if (!res.ok) {
        console.error("deleteContainer error:", res.status, data);
        throw new Error(data.message || "Erreur suppression container");
      }
      await fetchContainers();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("etodo:todos-updated"));
      }
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    }
  };



  const reorderContainers = async (order: number[]) => {
    try {
      const res = await fetch(`${BASE_URL}/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ order }),
      });
      if (redirectIfAuthError(res.status)) return false;
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Erreur reorder containers");
      }
      await fetchContainers();
      // notify other components if needed
      if (typeof window !== "undefined") window.dispatchEvent(new Event("etodo:todos-updated"));
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    }
  };

  const createContainer = async (title: string, color?: string | null) => {
    try {
      const res = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title, color }),
      });
      if (redirectIfAuthError(res.status)) return null;
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur création container");
      await fetchContainers();
      return data;
    } catch (e: any) {
      setError(e.message);
      return null;
    }
  };

  const updateContainer = async (id: number, title: string, color?: string | null) => {
    try {
      const res = await fetch(`${BASE_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title, color }),
      });
      if (redirectIfAuthError(res.status)) return null;
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur update container");
      await fetchContainers();
      return data;
    } catch (e: any) {
      setError(e.message);
      return null;
    }
  };

  useEffect(() => {
    if (!hasToken()) {
      window.location.href = AUTH_REDIRECT;
      return;
    }
    fetchContainers();
  }, []);

  return { containers, fetchContainers, createContainer, updateContainer, deleteContainer, reorderContainers, error, loading };
}