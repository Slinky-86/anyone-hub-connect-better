import { useState } from "react";
import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  Info,
  Heart,
  Github,
  Twitter,
  ExternalLink,
  Mail,
  Shield,
  Zap,
  Users,
  MessageSquare,
  Code,
  Star
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function About() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [_, navigate] = useLocation();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="h-screen flex flex-col">
      <Header 
        title="About AnyoneHub.dev" 
        toggleSidebar={toggleSidebar} 
        showBackButton={true}
        onBack={() => navigate("/messaging")}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
        
        <div className="flex-1 overflow-y-auto ml-0 md:ml-64 transition-all duration-300 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-primary mb-2">AnyoneHub.dev</h1>
              <p className="text-gray-600 dark:text-gray-300">
                A community platform for developers to connect, collaborate, and create
              </p>
              <div className="flex justify-center space-x-4 mt-4">
                <Badge variant="outline" className="px-4 py-1 text-primary">
                  <Code className="h-4 w-4 mr-2" />
                  Version 2.0
                </Badge>
                <Badge variant="outline" className="px-4 py-1 text-green-600">
                  <Star className="h-4 w-4 mr-2" />
                  Est. 2025
                </Badge>
              </div>
            </div>

            <div className="grid gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Info className="h-5 w-5 mr-2 text-primary" />
                    About AnyoneHub.dev
                  </CardTitle>
                  <CardDescription>
                    Our mission and vision
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h3 className="text-lg font-semibold mb-2">Our Mission</h3>
                  <p>
                    Bringing back the true meaning of open source, empowering developers of all kinds.
                  </p>
                  <p>
                    At anyone-hub.dev, we're committed to democratizing application development and empowering anyone with a phone and a dream. We believe that technology should be accessible to everyone, regardless of their background or experience level.
                  </p>
                  <p>
                    Our platform provides all the tools needed to make anyone a developer. We're building a community that supports collaboration, learning, and innovation - where experienced developers can mentor newcomers, and where great ideas can flourish regardless of where they originate.
                  </p>
                  <p>
                    By breaking down barriers to entry in the world of software development, we're creating a more inclusive tech ecosystem where diversity of thought leads to better solutions for everyone.
                  </p>
                </CardContent>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MessageSquare className="h-5 w-5 mr-2 text-primary" />
                      AnyoneConnect Messaging
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      AnyoneConnect is our secure messaging platform designed specifically for developers. It offers seamless communication with features like code snippet sharing, syntax highlighting, and integration with your development workflow.
                    </p>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-start">
                        <Shield className="h-4 w-4 mr-2 text-green-500 mt-1 flex-shrink-0" />
                        <p className="text-sm">End-to-end encryption for sensitive communications</p>
                      </div>
                      <div className="flex items-start">
                        <Zap className="h-4 w-4 mr-2 text-amber-500 mt-1 flex-shrink-0" />
                        <p className="text-sm">Real-time messaging with code formatting</p>
                      </div>
                      <div className="flex items-start">
                        <Users className="h-4 w-4 mr-2 text-blue-500 mt-1 flex-shrink-0" />
                        <p className="text-sm">Seamless integration with AnyoneHub.dev community</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2 text-primary" />
                      What We Offer
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-4 text-sm">
                      <li className="space-y-1">
                        <h4 className="font-medium">Community Collaboration</h4>
                        <p className="text-gray-600 dark:text-gray-300">
                          Connect with developers across all languages and experience levels to collaborate on exciting projects.
                        </p>
                      </li>
                      <li className="space-y-1">
                        <h4 className="font-medium">Knowledge Sharing</h4>
                        <p className="text-gray-600 dark:text-gray-300">
                          Share code snippets, tutorials, and best practices to help others learn and grow.
                        </p>
                      </li>
                      <li className="space-y-1">
                        <h4 className="font-medium">Project Discovery</h4>
                        <p className="text-gray-600 dark:text-gray-300">
                          Find open-source projects that need contributors or showcase your own work.
                        </p>
                      </li>
                      <li className="space-y-1">
                        <h4 className="font-medium">Development Resources</h4>
                        <p className="text-gray-600 dark:text-gray-300">
                          Access tools, libraries, and frameworks to accelerate your development process.
                        </p>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Separator className="my-8" />

            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold mb-4">Connect With Us</h2>
              <div className="flex justify-center space-x-4">
                <Button variant="outline" className="flex items-center" asChild>
                  <a href="https://github.com/anyonehub" target="_blank" rel="noopener noreferrer">
                    <Github className="h-4 w-4 mr-2" />
                    GitHub
                  </a>
                </Button>
                <Button variant="outline" className="flex items-center" asChild>
                  <a href="https://twitter.com/anyonehubdev" target="_blank" rel="noopener noreferrer">
                    <Twitter className="h-4 w-4 mr-2" />
                    Twitter
                  </a>
                </Button>
                <Button variant="outline" className="flex items-center" asChild>
                  <a href="mailto:contact@anyonehub.dev">
                    <Mail className="h-4 w-4 mr-2" />
                    Contact
                  </a>
                </Button>
              </div>
            </div>

            <div className="text-center py-4 mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Made with <Heart className="inline h-3 w-3 text-red-500" /> by the AnyoneHub.dev team
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                © 2025 AnyoneHub.dev. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}