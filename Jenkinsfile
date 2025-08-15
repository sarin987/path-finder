pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'your-docker-registry'
        DOCKER_CREDENTIALS = 'docker-hub-credentials'
        GIT_CREDENTIALS = 'github-ssh-key'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Set up environment') {
            steps {
                sh 'printenv'
                sh 'docker --version'
                sh 'docker-compose --version'
            }
        }
        
        stage('Run tests') {
            parallel {
                stage('Backend tests') {
                    steps {
                        dir('operational_backend') {
                            sh 'npm ci'
                            sh 'npm test'
                        }
                    }
                }
                
                stage('Frontend tests') {
                    steps {
                        dir('operational_frontend') {
                            sh 'npm ci'
                            sh 'CI=true npm test -- --coverage'
                        }
                    }
                }
            }
        }
        
        stage('Build and push images') {
            steps {
                script {
                    // Build and push backend
                    docker.withRegistry('', env.DOCKER_CREDENTIALS) {
                        def backendImage = docker.build("${env.DOCKER_REGISTRY}/emergency-backend:${env.BUILD_NUMBER}", 
                            "-f operational_backend/Dockerfile ./operational_backend")
                        backendImage.push()
                    }
                    
                    // Build and push frontend
                    docker.withRegistry('', env.DOCKER_CREDENTIALS) {
                        def frontendImage = docker.build("${env.DOCKER_REGISTRY}/emergency-frontend:${env.BUILD_NUMBER}", 
                            "-f operational_frontend/Dockerfile ./operational_frontend")
                        frontendImage.push()
                    }
                }
            }
        }
        
        stage('Deploy to staging') {
            when {
                branch 'staging'
            }
            steps {
                sh 'docker-compose -f docker-compose.prod.yml up -d'
            }
        }
        
        stage('Deploy to production') {
            when {
                branch 'main'
            }
            steps {
                script {
                    // Add production deployment steps here
                    // This could be a manual approval step in a real scenario
                    echo 'Deploying to production...'
                }
            }
        }
    }
    
    post {
        always {
            // Clean up
            sh 'docker system prune -f'
            
            // Archive test results
            junit '**/test-results/**/*.xml'
            
            // Clean workspace
            cleanWs()
        }
        
        success {
            slackSend(
                color: 'good',
                message: "SUCCESS: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.BUILD_URL})"
            )
        }
        
        failure {
            slackSend(
                color: 'danger',
                message: "FAILED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.BUILD_URL})"
            )
        }
    }
}
