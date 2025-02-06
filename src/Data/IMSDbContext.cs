using Microsoft.EntityFrameworkCore;

public class IMSDbContext : DbContext
{
    public IMSDbContext(DbContextOptions<IMSDbContext> options) : base(options) { }
    public DbSet<HandwrittenNote> HandwrittenNotes { get; set; }
}
