using System.ComponentModel.DataAnnotations;

public class HandwrittenNote
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = "Untitled";
    public string SVGData { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
