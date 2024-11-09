"use client";

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Bell, Plus, Settings } from "lucide-react"

type Project = {
  id: number
  title: string
  editor: string
  status: 'Draft' | 'In Progress' | 'Feedback'
  progress: number
}

// Separate storage card component
const StorageCard = ({ used, limit }: { used: number; limit: number }) => {
  const percentage = (used / limit) * 100;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Storage Usage</CardTitle>
        <CardDescription>
          {used} MB / {limit} MB used
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Progress value={percentage} className="w-full" />
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">Upgrade Storage</Button>
      </CardFooter>
    </Card>
  );
};

// Plan features card component
const PlanCard = () => (
  <Card>
    <CardHeader>
      <CardTitle>Your Plan</CardTitle>
      <CardDescription>Free Plan</CardDescription>
    </CardHeader>
    <CardContent>
      <ul className="list-disc list-inside space-y-2 text-sm">
        <li>1 project slot</li>
        <li>500MB storage</li>
        <li>2 version slots per project</li>
        <li>Basic support</li>
      </ul>
    </CardContent>
    <CardFooter>
      <Button className="w-full">Upgrade to Pro</Button>
    </CardFooter>
  </Card>
);

// Project overview card component
const ProjectsOverviewCard = ({ projects }: { projects: Project[] }) => (
  <Card>
    <CardHeader>
      <CardTitle>Projects Overview</CardTitle>
      <CardDescription>You have {projects.length} active projects</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        {projects.map(project => (
          <div key={project.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium">{project.title}</p>
              <p className="text-sm text-muted-foreground">Editor: {project.editor}</p>
            </div>
            <Badge 
              variant={
                project.status === "In Progress" 
                  ? "default" 
                  : project.status === "Feedback" 
                    ? "secondary" 
                    : "outline"
              }
            >
              {project.status}
            </Badge>
          </div>
        ))}
      </div>
    </CardContent>
    <CardFooter>
      <Button className="w-full">
        <Plus className="mr-2 h-4 w-4" /> New Project
      </Button>
    </CardFooter>
  </Card>
);

// Project card component
const ProjectCard = ({ project }: { project: Project }) => (
  <Card>
    <CardHeader>
      <CardTitle>{project.title}</CardTitle>
      <CardDescription>Editor: {project.editor}</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>{project.progress}%</span>
        </div>
        <Progress value={project.progress} className="w-full" />
      </div>
    </CardContent>
    <CardFooter className="flex justify-between">
      <Button variant="outline">View Details</Button>
      <Badge 
        variant={
          project.status === "In Progress" 
            ? "default" 
            : project.status === "Feedback" 
              ? "secondary" 
              : "outline"
        }
      >
        {project.status}
      </Badge>
    </CardFooter>
  </Card>
);

export default function CreatorDashboard() {
  const [projects, setProjects] = useState<Project[]>([
    { id: 1, title: "Summer Vlog Series", editor: "Alex", status: "In Progress", progress: 65 },
    { id: 2, title: "Product Review: Tech Gadgets", editor: "Sam", status: "Feedback", progress: 90 },
    { id: 3, title: "Travel Documentary", editor: "Jamie", status: "Draft", progress: 30 },
  ])

  const storageUsed = 350 // MB
  const storageLimit = 500 // MB

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">CreatorConnect</h1>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            <Avatar>
              <AvatarImage src="/placeholder-user.jpg" alt="Creator" />
              <AvatarFallback>CC</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <ProjectsOverviewCard projects={projects} />
          <StorageCard used={storageUsed} limit={storageLimit} />
          <PlanCard />
        </div>

        <h2 className="text-2xl font-bold mt-12 mb-6">Active Projects</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </main>
    </div>
  )
}