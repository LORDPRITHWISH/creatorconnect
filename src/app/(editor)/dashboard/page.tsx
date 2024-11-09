import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Bell, Calendar, MessageSquare, Settings, Upload } from "lucide-react"

// Define types for better type safety
type Project = {
  id: number
  title: string
  creator: string
  status: 'Draft' | 'In Progress' | 'Feedback'
  progress: number
  deadline: string
}

type FeedbackItem = {
  id: number
  project: string
  creator: string
  message: string
}

// Separate component for the header
const DashboardHeader = ({ user }: { user: any }) => (
  <header className="border-b">
    <div className="container mx-auto px-4 py-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold">
        CreatorConnect <span className="text-muted-foreground">| Editor</span>
      </h1>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
        <Avatar>
          <AvatarImage src="/placeholder-user.jpg" alt="Editor" />
          <AvatarFallback>ED</AvatarFallback>
        </Avatar>
      </div>
    </div>
  </header>
)

// Project card component
const ProjectsCard = ({ projects }: { projects: Project[] }) => (
  <Card>
    <CardHeader>
      <CardTitle>Active Projects</CardTitle>
      <CardDescription>You have {projects.length} active projects</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        {projects.map(project => (
          <div key={project.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium">{project.title}</p>
              <p className="text-sm text-muted-foreground">Creator: {project.creator}</p>
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
      <Button className="w-full">View All Projects</Button>
    </CardFooter>
  </Card>
)

// Deadlines card component
const DeadlinesCard = ({ projects }: { projects: Project[] }) => (
  <Card>
    <CardHeader>
      <CardTitle>Upcoming Deadlines</CardTitle>
      <CardDescription>Stay on top of your schedule</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        {projects.map(project => (
          <div key={project.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium">{project.title}</p>
              <p className="text-sm text-muted-foreground">Due: {project.deadline}</p>
            </div>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)

// Feedback card component
const FeedbackCard = ({ feedback }: { feedback: FeedbackItem[] }) => (
  <Card>
    <CardHeader>
      <CardTitle>Recent Feedback</CardTitle>
      <CardDescription>Latest comments from creators</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        {feedback.map(item => (
          <div key={item.id} className="space-y-1">
            <p className="font-medium">{item.project}</p>
            <p className="text-sm text-muted-foreground">
              {item.creator}: {item.message}
            </p>
          </div>
        ))}
      </div>
    </CardContent>
    <CardFooter>
      <Button variant="outline" className="w-full">
        <MessageSquare className="mr-2 h-4 w-4" /> Respond to Feedback
      </Button>
    </CardFooter>
  </Card>
)

// Projects table component
const ProjectsTable = ({ projects }: { projects: Project[] }) => (
  <>
    <h2 className="text-2xl font-bold mt-12 mb-6">Project Details</h2>
    <div className="w-full overflow-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left p-4">Project</th>
            <th className="text-left p-4">Creator</th>
            <th className="text-left p-4">Status</th>
            <th className="text-left p-4">Progress</th>
            <th className="text-left p-4">Deadline</th>
            <th className="text-left p-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map(project => (
            <tr key={project.id} className="border-b">
              <td className="p-4 font-medium">{project.title}</td>
              <td className="p-4">{project.creator}</td>
              <td className="p-4">
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
              </td>
              <td className="p-4">
                <Progress value={project.progress} className="w-[60px]" />
              </td>
              <td className="p-4">{project.deadline}</td>
              <td className="p-4">
                <Button variant="ghost" size="sm">
                  <Upload className="mr-2 h-4 w-4" /> Submit
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
)

// Main dashboard component
function EditorDashboard() {
  const [projects] = useState<Project[]>([
    {
      id: 1,
      title: "Summer Vlog Series",
      creator: "Emma",
      status: "In Progress",
      progress: 65,
      deadline: "2024-03-15"
    },
    {
      id: 2,
      title: "Product Review: Tech Gadgets",
      creator: "Alex",
      status: "Feedback",
      progress: 90,
      deadline: "2024-03-10"
    },
    {
      id: 3,
      title: "Travel Documentary",
      creator: "Sophie",
      status: "Draft",
      progress: 30,
      deadline: "2024-03-20"
    }
  ])

  const [feedback] = useState<FeedbackItem[]>([
    {
      id: 1,
      project: "Summer Vlog Series",
      creator: "Emma",
      message: "Great work on the intro! Can we add more b-roll in the middle section?"
    },
    {
      id: 2,
      project: "Product Review: Tech Gadgets",
      creator: "Alex",
      message: "The pacing feels a bit slow. Can we tighten up the transitions?"
    }
  ])

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={{}} />
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <ProjectsCard projects={projects} />
          <DeadlinesCard projects={projects} />
          <FeedbackCard feedback={feedback} />
        </div>
        <ProjectsTable projects={projects} />
      </main>
    </div>
  )
}

export default EditorDashboard