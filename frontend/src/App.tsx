import React, { useState } from 'react'
import axios from 'axios'
import { Container, Row, Col, Card, Button, Form, Spinner, Alert } from 'react-bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [srtContent, setSrtContent] = useState('')
  const [error, setError] = useState('')
  const [errorDetails, setErrorDetails] = useState('')

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0])
      setError('')
      setErrorDetails('')
    }
  }

  const handleSubmit = async () => {
    if (!file) {
      setError('Veuillez sélectionner un fichier audio')
      return
    }

    setLoading(true)
    setError('')
    setErrorDetails('')
    setSrtContent('')

    const formData = new FormData()
    formData.append('audio', file)

    try {
      const response = await axios.post('http://localhost:3000/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      setSrtContent(response.data.srt)
    } catch (err: any) {
      setError('Une erreur est survenue lors de la transcription')
      if (err.response?.data?.details) {
        setErrorDetails(err.response.data.details)
      } else {
        setErrorDetails(err.message)
      }
      console.error('Erreur complète:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <h1 className="text-center mb-4">Transcription Audio en SRT</h1>

          <Card className="mb-4">
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Sélectionner un fichier audio</Form.Label>
                  <Form.Control
                    type="file"
                    accept="audio/*"
                    onChange={handleFileChange}
                    disabled={loading}
                  />
                </Form.Group>

                {file && (
                  <p className="text-muted">
                    Fichier sélectionné : {file.name}
                  </p>
                )}

                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={!file || loading}
                  className="w-100"
                >
                  {loading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Transcription en cours...
                    </>
                  ) : (
                    'Transcrire'
                  )}
                </Button>

                {error && (
                  <Alert variant="danger" className="mt-3">
                    <Alert.Heading>{error}</Alert.Heading>
                    {errorDetails && (
                      <p className="mb-0">
                        <small>{errorDetails}</small>
                      </p>
                    )}
                  </Alert>
                )}
              </Form>
            </Card.Body>
          </Card>

          {srtContent && (
            <Card>
              <Card.Body>
                <Card.Title>Résultat de la transcription :</Card.Title>
                <Form.Control
                  as="textarea"
                  rows={10}
                  value={srtContent}
                  readOnly
                  className="mt-3"
                />
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  )
}

export default App 